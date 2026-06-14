import { useForm } from 'react-hook-form'

type FormData = {
  fullName: string
  email: string
  skills: string
  interests: string
  bio: string
}

export default function ProfileForm({ defaultValues }: { defaultValues?: Partial<FormData> }) {
  const { register, handleSubmit } = useForm<FormData>({ defaultValues })

  const onSubmit = (data: FormData) => {
    // mock submit
    alert('Profile updated (mock)')
    console.log(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 bg-white p-4 rounded">
      <div>
        <label className="block text-sm">Full Name</label>
        <input {...register('fullName')} className="w-full border rounded px-2 py-1" />
      </div>
      <div>
        <label className="block text-sm">Email</label>
        <input {...register('email')} className="w-full border rounded px-2 py-1" />
      </div>
      <div>
        <label className="block text-sm">Skills</label>
        <input {...register('skills')} className="w-full border rounded px-2 py-1" />
      </div>
      <div>
        <label className="block text-sm">Interests</label>
        <input {...register('interests')} className="w-full border rounded px-2 py-1" />
      </div>
      <div>
        <label className="block text-sm">Bio</label>
        <textarea {...register('bio')} className="w-full border rounded px-2 py-1" rows={4} />
      </div>
      <div>
        <button type="submit" className="px-4 py-2 rounded bg-[var(--color-primary)] text-white">Save</button>
      </div>
    </form>
  )
}
