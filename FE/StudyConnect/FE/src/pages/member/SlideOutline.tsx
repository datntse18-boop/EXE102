import { useEffect, useState } from 'react'
import pptxgen from 'pptxgenjs'
import { teamService, projectService, slideService } from '../../services/apiServices'
import { useAuth } from '../../contexts/AuthContext'
import Card from '../../components/cards/Card'
import {
  Sparkles,
  Loader2,
  Printer,
  Compass,
  FileText,
  AlertCircle
} from 'lucide-react'

interface Slide {
  slideNum: number
  title: string
  bullets: string[]
  visualSuggestion: string
}

export default function SlideOutline() {
  const { user } = useAuth()
  
  // Projects & Team States
  const [teams, setTeams] = useState<any[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Slides State
  const [slides, setSlides] = useState<Slide[]>([])
  const [generating, setGenerating] = useState(false)

  // Load teams
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const data = await teamService.getTeams()
        setTeams(data)
        if (data.length > 0) {
          setSelectedTeamId(data[0].id)
        }
      } catch (err) {
        console.error(err)
      }
    }
    fetchTeams()
  }, [])

  // Load project & slides
  useEffect(() => {
    if (!selectedTeamId) return
    const fetchProjectAndSlides = async () => {
      setLoading(true)
      try {
        const projData = await projectService.getProjects({ teamId: selectedTeamId })
        if (projData.length > 0) {
          const activeProj = projData[0]
          setProject(activeProj)
          if (activeProj.slideOutline) {
            try {
              const parsed = JSON.parse(activeProj.slideOutline)
              setSlides(parsed.slides || [])
            } catch {
              setSlides([])
            }
          } else {
            setSlides([])
          }
        } else {
          setProject(null)
          setSlides([])
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchProjectAndSurveys()
  }, [selectedTeamId])

  // Alias for fetch
  const fetchProjectAndSurveys = async () => {
    if (!selectedTeamId) return
    try {
      const projData = await projectService.getProjects({ teamId: selectedTeamId })
      if (projData.length > 0) {
        const activeProj = projData[0]
        setProject(activeProj)
        if (activeProj.slideOutline) {
          try {
            const parsed = JSON.parse(activeProj.slideOutline)
            setSlides(parsed.slides || [])
          } catch {
            setSlides([])
          }
        } else {
          setSlides([])
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleGenerateSlides = async () => {
    if (!project) return
    setGenerating(true)
    try {
      const res = await slideService.generateSlides(project.id)
      setSlides(res.slides || [])
      alert('Đã tạo dàn ý Slide thuyết trình bằng AI thành công!')
    } catch (err) {
      console.error(err)
      alert('Lỗi khởi tạo slide. Vui lòng kiểm tra API Key hoặc Business Canvas đã được lập trước đó.')
    } finally {
      setGenerating(false)
    }
  }

  const handleDownloadPPTX = () => {
    if (slides.length === 0) return

    const pptx = new pptxgen()
    pptx.title = `Pitch Deck - ${project?.name || 'Startup'}`
    pptx.subject = 'Startup Pitch Deck Outline'
    pptx.author = 'StudyConnect AI Slide Generator'

    // Define colors
    const bgColor = '1B1B22' // obsidian dark
    const titleColor = 'FF6B00' // orange
    const textColor = 'FFFFFF'
    const footerColor = '888888'

    slides.forEach(slide => {
      const pptxSlide = pptx.addSlide()
      pptxSlide.background = { fill: bgColor }

      // Title
      pptxSlide.addText(slide.title, {
        x: 0.5,
        y: 0.6,
        w: '90%',
        h: 0.8,
        fontSize: 24,
        bold: true,
        color: titleColor,
        fontFace: 'Arial'
      })

      // Bullets
      const bulletsList = slide.bullets.map(b => {
        return { text: b, options: { bullet: true, color: textColor, fontSize: 14 } }
      })

      pptxSlide.addText(bulletsList, {
        x: 0.5,
        y: 1.6,
        w: '90%',
        h: 2.8,
        color: textColor,
        fontFace: 'Arial'
      })

      // Visual suggestions
      pptxSlide.addText(`Visual Suggestion: ${slide.visualSuggestion}`, {
        x: 0.5,
        y: 4.8,
        w: '90%',
        h: 0.8,
        fontSize: 10,
        italic: true,
        color: footerColor,
        fontFace: 'Arial'
      })

      // Slide number
      pptxSlide.addText(`Slide ${slide.slideNum} / ${slides.length} - ${project?.name || 'StudyConnect'}`, {
        x: 0.5,
        y: 5.8,
        w: '90%',
        h: 0.3,
        fontSize: 9,
        color: footerColor,
        align: 'right'
      })
    })

    pptx.writeFile({ fileName: `PitchDeck_${project?.name || 'Startup'}.pptx` })
      .then(() => {
        alert('Tải slide PowerPoint (.pptx) thành công! 🎉')
      })
      .catch(err => {
        console.error('PPTX generation error:', err)
        alert('Không thể tạo file PowerPoint.')
      })
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-10 print-container">
      
      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          aside, nav, header, button, .no-print, .top-nav {
            display: none !important;
          }
          .print-card {
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .slide-page {
            page-break-after: always !important;
            border: 2px solid #000 !important;
            border-radius: 8px !important;
            padding: 40px !important;
            margin-bottom: 20px !important;
            background: white !important;
            color: black !important;
            min-height: 480px !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
          }
        }
      `}} />

      {/* Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#1B1B22] via-[#2F2F3B] to-[#1B1B22] text-white rounded-3xl p-8 shadow-xl border border-gray-800 no-print">
        <div className="relative z-10 max-w-xl">
          <span className="bg-[#FF6B00] px-3.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-sm flex items-center gap-1.5 w-max">
            <FileText className="w-3.5 h-3.5" />
            AI Slide Deck Copilot
          </span>
          <h1 className="text-3xl font-black mt-4 tracking-tight leading-none text-white">
            Trình Thiết Kế Slide Pitch Deck 🖨️
          </h1>
          <p className="text-sm text-gray-300 mt-3 font-medium opacity-90 leading-relaxed">
            AI tự động phác thảo 10 slides thuyết trình chuẩn quốc tế dựa trên Business Canvas và mô tả dự án của bạn để thuyết trình Demo Day.
          </p>
        </div>
        <div className="absolute right-8 bottom-0 top-0 opacity-10 w-1/4 flex items-center justify-center pointer-events-none">
          <span className="text-9xl">🖨️</span>
        </div>
      </div>

      {/* Select Team Panel */}
      <div className="flex items-center justify-between gap-4 bg-white dark:bg-[#13131C] p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 no-print">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-gray-500">Chọn nhóm dự án:</span>
          <select
            value={selectedTeamId}
            onChange={e => setSelectedTeamId(e.target.value)}
            className="border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-[#FF6B00] font-bold text-gray-700 dark:text-gray-300 bg-transparent"
          >
            {teams.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        {slides.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={handleDownloadPPTX}
              className="px-4 py-2 bg-[#FF6B00] text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-[#E85A00] transition flex items-center gap-1.5 shadow-sm border border-transparent"
            >
              <FileText className="w-4 h-4" />
              Tải PowerPoint (.pptx)
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-gray-850 dark:bg-gray-800 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-gray-950 dark:hover:bg-gray-900 transition flex items-center gap-1.5 shadow-sm border border-gray-750 dark:border-gray-700"
            >
              <Printer className="w-4 h-4 text-orange-500" />
              Xuất Slide Deck (PDF)
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center p-12 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin text-[#FF6B00] mr-2" /> Đang tải cấu trúc slide...
        </div>
      ) : !project ? (
        <div className="bg-white dark:bg-[#13131C] rounded-2xl border border-gray-100 dark:border-gray-800 p-20 flex flex-col items-center justify-center text-center text-gray-400 shadow-sm no-print">
          <AlertCircle className="w-12 h-12 text-gray-200 dark:text-gray-700 mb-3" />
          <h4 className="font-bold text-gray-700 dark:text-gray-300 text-xs">Chưa tạo dự án</h4>
          <p className="text-[10px] text-gray-400 mt-1">
            Nhóm chưa có dự án nào hoạt động.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Create Button State */}
          {slides.length === 0 && (
            <div className="max-w-md mx-auto no-print">
              <Card className="text-center py-8">
                <span className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center mx-auto text-orange-650 text-xl font-bold mb-4">
                  🎨
                </span>
                <h3 className="font-bold text-gray-800 dark:text-white text-sm">Chưa khởi tạo dàn ý slide</h3>
                <p className="text-[11px] text-gray-450 dark:text-gray-500 mt-1.5 max-w-xs mx-auto leading-relaxed">
                  AI sẽ đọc mô hình Business Canvas 9 ô của bạn để phác họa dàn ý 10 slides đúng tiêu chuẩn gọi vốn.
                </p>
                <button
                  onClick={handleGenerateSlides}
                  disabled={generating}
                  className="mt-6 px-6 py-2.5 bg-gradient-to-r from-orange-500 to-[#FF6B00] text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-1.5 mx-auto"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Đang tạo slide...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Sinh slide bằng AI
                    </>
                  )}
                </button>
              </Card>
            </div>
          )}

          {/* Slides display list */}
          {slides.length > 0 && (
            <div className="space-y-6 max-w-4xl mx-auto print-card">
              
              <div className="flex justify-between items-center no-print">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Trình xem trước 10 slides thuyết trình</h4>
                <button
                  onClick={handleGenerateSlides}
                  disabled={generating}
                  className="text-xs text-[#FF6B00] font-black flex items-center gap-1 transition hover:opacity-80 disabled:opacity-50"
                >
                  {generating ? 'Đang tạo lại...' : 'Tải lại/Tạo mới với AI'}
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6 no-print">
                {slides.map(slide => (
                  <div
                    key={slide.slideNum}
                    className="aspect-video bg-white dark:bg-[#13131C] border border-gray-150 dark:border-gray-850 rounded-2xl p-5 flex flex-col justify-between shadow-sm transition hover:shadow-md hover:border-orange-200/50"
                  >
                    <div>
                      <div className="flex justify-between items-center border-b dark:border-gray-850 pb-2 mb-3">
                        <span className="text-[10px] font-bold text-gray-400">Slide {slide.slideNum}</span>
                        <span className="text-[9px] font-black uppercase text-[#FF6B00] tracking-wider">Standard Deck</span>
                      </div>
                      <h4 className="text-xs font-black text-gray-800 dark:text-white mb-2.5">{slide.title}</h4>
                      <ul className="space-y-1.5 pl-4 list-disc text-[10px] text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
                        {slide.bullets.map((b, bIdx) => (
                          <li key={bIdx}>{b}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-4 pt-2 border-t dark:border-gray-850 text-[9px] text-gray-400 bg-gray-50/60 dark:bg-[#0B0B0F]/50 p-2 rounded-lg leading-relaxed">
                      <span className="font-bold text-[#FF6B00] block mb-0.5">📸 Đồ họa & Hình ảnh gợi ý:</span>
                      {slide.visualSuggestion}
                    </div>
                  </div>
                ))}
              </div>

              {/* Printable-only Layout block */}
              <div className="hidden print:block space-y-6">
                {slides.map(slide => (
                  <div key={slide.slideNum} className="slide-page">
                    <div>
                      <div className="flex justify-between items-center border-b pb-2 mb-4">
                        <span className="text-sm font-bold text-gray-500">SLIDE DECK OUTLINE</span>
                        <span className="text-sm font-bold text-gray-700">SLIDE {slide.slideNum} / 10</span>
                      </div>
                      <h2 className="text-xl font-black text-black mb-6">{slide.title}</h2>
                      
                      <ul className="space-y-4 pl-6 list-disc text-sm text-gray-850 font-medium leading-relaxed">
                        {slide.bullets.map((b, bIdx) => (
                          <li key={bIdx}>{b}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-8 pt-4 border-t text-xs text-gray-600 bg-gray-50 p-4 rounded-lg leading-relaxed">
                      <span className="font-bold text-orange-600 block mb-1">GỢI Ý THỂ HIỆN HÌNH ẢNH:</span>
                      {slide.visualSuggestion}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

        </div>
      )}
    </div>
  )
}
