import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'WebVault - 首页',
  description: '发现和收藏优质网站资源',
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-white mb-4">
            Web<span className="text-blue-600">Vault</span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-8">
            发现、收藏和管理优质网站资源
          </p>
          <div className="max-w-2xl mx-auto">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
              <div className="flex items-center space-x-4 mb-6">
                <input
                  type="text"
                  placeholder="搜索网站..."
                  className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                />
                <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  搜索
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* 分类导航 */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          {['所有分类', '开发工具', '设计资源', '学习教育', '生活服务', '娱乐休闲'].map((category) => (
            <div
              key={category}
              className="bg-white dark:bg-slate-800 rounded-lg p-4 text-center hover:shadow-md transition-shadow cursor-pointer"
            >
              <span className="text-slate-700 dark:text-slate-300">{category}</span>
            </div>
          ))}
        </div>

        {/* 网站展示区域 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">W</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    示例网站 {i}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 text-sm mb-3">
                    这是一个示例网站的描述信息，展示网站的主要功能和用途。
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded">
                      工具
                    </span>
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded">
                      免费
                    </span>
                  </div>
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    访问网站 →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}