import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0A0A0D] text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center text-red-500 text-2xl mb-4">
            ⚠️
          </div>
          <h1 className="text-xl font-bold text-gray-100 mb-2">Đã xảy ra sự cố khi tải trang</h1>
          <p className="text-xs text-gray-400 max-w-md mb-6 leading-relaxed">
            Hệ thống phát hiện lỗi hiển thị giao diện. Bạn vui lòng bấm nút bên dưới để tải lại dữ liệu hoặc quay lại bảng điều khiển.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null })
                window.location.href = '/dashboard'
              }}
              className="px-5 py-2.5 bg-[#FF6B00] hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-lg transition cursor-pointer"
            >
              Về Trang Bảng Điều Khiển
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Tải Lại Trang
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
export default ErrorBoundary
