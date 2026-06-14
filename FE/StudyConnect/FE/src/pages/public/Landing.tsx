import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="py-12">
      <section className="text-center py-12">
        <h1 className="text-4xl font-bold mb-4">AI StudyConnect</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">Connect students and makers to real-world startup opportunities, build teams, and track contribution.</p>
        <div className="mt-6 flex justify-center gap-4">
          <Link to="/register" className="px-4 py-2 rounded bg-[var(--color-primary)] text-white">Get Started</Link>
          <Link to="/pricing" className="px-4 py-2 rounded border">Pricing</Link>
        </div>
      </section>

      <section className="mt-8 grid md:grid-cols-3 gap-4">
        <div className="card">Hero Feature 1</div>
        <div className="card">Hero Feature 2</div>
        <div className="card">Hero Feature 3</div>
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-semibold">How it works</h2>
        <p className="text-gray-600">Browse opportunities, join teams, generate ideas with AI, and manage projects.</p>
      </section>
    </div>
  )
}
