import { Request, Response } from 'express'
import prisma from '../lib/prisma'

// Helper to update team health score
const updateTeamHealth = async (projectId: string): Promise<void> => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { teamId: true }
    })
    if (!project) return
    const teamId = project.teamId
    const projects = await prisma.project.findMany({ where: { teamId } })
    const allTasks = await prisma.task.findMany({ where: { projectId: { in: projects.map(p => p.id) } } })
    
    let score = 80
    if (allTasks.length > 0) {
      const completed = allTasks.filter(t => t.status === 'completed').length
      const overdue = allTasks.filter(t => t.dueDate && t.dueDate < new Date() && t.status !== 'completed').length
      score = Math.max(0, Math.round((completed / allTasks.length) * 100) - overdue * 5)
      score = Math.min(100, score)
    }
    
    await prisma.team.update({
      where: { id: teamId },
      data: { healthScore: score }
    })
  } catch (err) {
    console.error('Error updating team health score:', err)
  }
}

// POST /api/github/webhook
export const handleGithubWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const { repoUrl, commitMessage, projectId } = req.body

    if (!commitMessage) {
      res.status(400).json({ success: false, message: 'commitMessage is required' })
      return
    }

    // Identify project by projectId or githubUrl
    let targetProjectId = projectId

    if (!targetProjectId && repoUrl) {
      const proj = await prisma.project.findFirst({
        where: {
          githubUrl: {
            contains: repoUrl.trim()
          }
        }
      })
      if (proj) {
        targetProjectId = proj.id
      }
    }

    if (!targetProjectId) {
      res.status(400).json({ success: false, message: 'Could not identify project for this repository' })
      return
    }

    // Try to parse closing keywords: close:, fix:, resolve:, complete:
    // Support formats: close: "Task Title", close: Task Title
    const regexPatterns = [
      /(?:close|fix|resolve|complete):\s*["']([^"']+)["']/i,
      /(?:close|fix|resolve|complete):\s*([^\n\r]+)/i
    ]

    let taskTitleToClose = ''
    for (const pattern of regexPatterns) {
      const match = commitMessage.match(pattern)
      if (match && match[1]) {
        taskTitleToClose = match[1].trim()
        break
      }
    }

    if (!taskTitleToClose) {
      res.json({ 
        success: true, 
        message: 'Webhook received but no closing keywords found in commit message.',
        closedTask: null 
      })
      return
    }

    // Search for the task (case-insensitive title contains match)
    const tasks = await prisma.task.findMany({
      where: {
        projectId: targetProjectId,
        status: { not: 'completed' }
      }
    })

    const matchedTask = tasks.find(t => 
      t.title.toLowerCase().includes(taskTitleToClose.toLowerCase()) || 
      taskTitleToClose.toLowerCase().includes(t.title.toLowerCase())
    )

    if (!matchedTask) {
      res.json({ 
        success: true, 
        message: `Webhook received. Closing keyword found for task name "${taskTitleToClose}" but no active matching task was found in Kanban.`,
        closedTask: null
      })
      return
    }

    // Update task status to completed
    const updatedTask = await prisma.task.update({
      where: { id: matchedTask.id },
      data: { status: 'completed' }
    })

    // Update team health
    await updateTeamHealth(targetProjectId)

    // Save notification for team
    const project = await prisma.project.findUnique({
      where: { id: targetProjectId },
      select: { teamId: true, name: true }
    })

    if (project) {
      // Find team leader or members to notify
      const teamMembers = await prisma.teamMember.findMany({
        where: { teamId: project.teamId },
        select: { userId: true }
      })

      // Create notification for everyone in team
      await Promise.all(
        teamMembers.map(tm => 
          prisma.notification.create({
            data: {
              userId: tm.userId,
              title: 'GitHub Automation',
              content: `Task "${updatedTask.title}" của dự án "${project.name}" đã tự động hoàn thành qua Git commit.`,
              link: `/workspace`
            }
          })
        )
      )
    }

    res.json({
      success: true,
      message: `GitHub Webhook: Tự động hoàn thành Task "${updatedTask.title}" thành công!`,
      closedTask: updatedTask
    })
  } catch (err) {
    console.error('GitHub Webhook Error:', err)
    res.status(500).json({ success: false, message: 'Webhook processing failed' })
  }
}
