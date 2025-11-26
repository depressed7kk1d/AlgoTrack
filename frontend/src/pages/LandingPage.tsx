import { useNavigate } from 'react-router-dom'
import { 
  Sparkles, 
  MessageSquare, 
  BarChart3, 
  Clock, 
  Shield, 
  Zap,
  ChevronRight,
  Check,
  Star,
  Users,
  School,
  Bot,
  Send,
  Radio
} from 'lucide-react'

export default function LandingPage() {
  const navigate = useNavigate()

  const features = [
    {
      icon: Bot,
      title: 'AI-генерация ОС',
      description: 'Нейросеть создаёт персональную обратную связь для каждого ученика за секунды',
      color: 'from-violet-500 to-purple-600',
    },
    {
      icon: MessageSquare,
      title: 'WhatsApp интеграция',
      description: 'Автоматическая отправка ОС в группы родителей с защитой от бана',
      color: 'from-green-500 to-emerald-600',
    },
    {
      icon: Send,
      title: 'Умные рассылки',
      description: 'Массовая рассылка с антибан-системой: чередование сообщений, умные задержки',
      color: 'from-rose-500 to-pink-600',
    },
    {
      icon: BarChart3,
      title: 'PDF отчёты',
      description: 'Красивые отчёты с графиками успеваемости для родителей',
      color: 'from-blue-500 to-cyan-600',
    },
    {
      icon: Clock,
      title: 'Планирование',
      description: 'Запланируйте отправку ОС или рассылки на удобное время до 4 дней вперёд',
      color: 'from-amber-500 to-orange-600',
    },
    {
      icon: Shield,
      title: 'Антибан защита',
      description: 'Несколько вариантов сообщений, случайные задержки, лимиты — WhatsApp не забанит',
      color: 'from-indigo-500 to-blue-600',
    },
  ]

  const plans = [
    {
      name: 'Старт',
      price: '2 990',
      period: 'месяц',
      description: 'Для небольших школ',
      features: [
        'До 3 преподавателей',
        'До 50 учеников',
        'AI-генерация ОС',
        'WhatsApp интеграция',
        'Email поддержка',
      ],
      popular: false,
    },
    {
      name: 'Бизнес',
      price: '7 990',
      period: 'месяц',
      description: 'Для растущих школ',
      features: [
        'До 10 преподавателей',
        'До 200 учеников',
        'AI-генерация ОС',
        'WhatsApp интеграция',
        'PDF отчёты',
        'Приоритетная поддержка',
        'Персональный шаблон ОС',
      ],
      popular: true,
    },
    {
      name: 'Премиум',
      price: '14 990',
      period: 'месяц',
      description: 'Для сетей школ',
      features: [
        'Безлимит преподавателей',
        'Безлимит учеников',
        'Всё из тарифа Бизнес',
        'Несколько филиалов',
        'API доступ',
        'Персональный менеджер',
        'Обучение команды',
      ],
      popular: false,
    },
  ]

  const stats = [
    { value: '10+', label: 'Школ' },
    { value: '200+', label: 'Учеников' },
    { value: '1 000+', label: 'ОС в месяц' },
    { value: '95%', label: 'Довольных клиентов' },
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-violet-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-rose-500/20 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 backdrop-blur-xl bg-slate-950/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              AlgoTrack
            </span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-slate-400 hover:text-white transition-colors">Возможности</a>
            <a href="#pricing" className="text-slate-400 hover:text-white transition-colors">Тарифы</a>
            <a href="#contact" className="text-slate-400 hover:text-white transition-colors">Контакты</a>
          </nav>

          <button
            onClick={() => navigate('/login')}
            className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 rounded-lg font-medium hover:from-violet-500 hover:to-purple-500 transition-all shadow-lg shadow-violet-500/25"
          >
            Войти
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 pt-20 pb-32 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 border border-violet-500/20 rounded-full text-violet-400 text-sm mb-8">
            <Sparkles className="w-4 h-4" />
            Автоматизация отчётности для школ программирования
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-white via-violet-200 to-white bg-clip-text text-transparent">
              Обратная связь
            </span>
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              на автопилоте
            </span>
          </h1>
          
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
            AI генерирует персональную обратную связь для родителей, 
            а бот отправляет её в WhatsApp. Экономьте до 10 часов в неделю.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="group px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl font-semibold text-lg hover:from-violet-500 hover:to-purple-500 transition-all shadow-2xl shadow-violet-500/30 flex items-center gap-2"
            >
              Связаться с менеджером
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="px-8 py-4 border border-white/20 rounded-xl font-semibold text-lg hover:bg-white/5 transition-all">
              Смотреть демо
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative z-10 py-16 border-y border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-slate-400 mt-2">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Всё что нужно для отчётности</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              От заполнения карточек до отправки в WhatsApp — всё в одном месте
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all duration-300"
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 py-24 px-6 bg-gradient-to-b from-transparent to-violet-950/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Как это работает</h2>
            <p className="text-slate-400 text-lg">3 простых шага</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Заполните карточки',
                description: 'После урока учитель заполняет карточки учеников: процент выполнения, активность, настроение',
                icon: Users,
              },
              {
                step: '02',
                title: 'AI генерирует ОС',
                description: 'Нейросеть создаёт персональную обратную связь на основе данных и вашего стиля',
                icon: Bot,
              },
              {
                step: '03',
                title: 'Бот отправляет',
                description: 'Сообщение автоматически отправляется в WhatsApp группу родителей',
                icon: MessageSquare,
              },
            ].map((item, index) => (
              <div key={item.step} className="relative">
                {index < 2 && (
                  <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-violet-500/50 to-transparent" />
                )}
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mb-6 border border-violet-500/30">
                    <item.icon className="w-10 h-10 text-violet-400" />
                  </div>
                  <div className="text-violet-400 font-mono text-sm mb-2">{item.step}</div>
                  <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                  <p className="text-slate-400">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative z-10 py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Тарифы</h2>
            <p className="text-slate-400 text-lg">Выберите план для вашей школы</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative p-8 rounded-2xl border transition-all ${
                  plan.popular
                    ? 'bg-gradient-to-b from-violet-500/10 to-purple-500/10 border-violet-500/50 scale-105'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-violet-600 to-purple-600 rounded-full text-sm font-medium flex items-center gap-1">
                    <Star className="w-4 h-4" /> Популярный
                  </div>
                )}
                
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-slate-400 text-sm mb-6">{plan.description}</p>
                
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-slate-400"> ₽/{plan.period}</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-slate-300">
                      <Check className="w-5 h-5 text-violet-400 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => navigate('/login')}
                  className={`w-full py-3 rounded-xl font-semibold transition-all ${
                    plan.popular
                      ? 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 shadow-lg shadow-violet-500/25'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  Выбрать план
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-12 bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl border border-white/10">
            <School className="w-16 h-16 mx-auto text-violet-400 mb-6" />
            <h2 className="text-4xl font-bold mb-4">Готовы автоматизировать отчётность?</h2>
            <p className="text-slate-400 text-lg mb-8">
              Присоединяйтесь к 500+ школам, которые уже экономят время с AlgoTrack
            </p>
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl font-semibold text-lg hover:from-violet-500 hover:to-purple-500 transition-all shadow-2xl shadow-violet-500/30"
            >
              Связаться с менеджером
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="relative z-10 border-t border-white/10 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
                <span className="text-xl font-bold">AlgoTrack</span>
              </div>
              <p className="text-slate-400 text-sm">
                Автоматизация отчётности для школ программирования
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Продукт</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#features" className="hover:text-white transition-colors">Возможности</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Тарифы</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Документация</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Компания</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">О нас</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Блог</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Вакансии</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Контакты</h4>
              <ul className="space-y-2 text-slate-400">
                <li>support@algoschool.org</li>
                <li>+7 (999) 123-45-67</li>
                <li><a href="https://t.me/EternalDespairInTheSilence" target="_blank" rel="noopener noreferrer" className="hover:text-violet-400 transition-colors">Telegram: @EternalDespairInTheSilence</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-sm">© 2025 AlgoTrack. Все права защищены.</p>
            <div className="flex items-center gap-6 text-slate-500 text-sm">
              <a href="#" className="hover:text-white transition-colors">Политика конфиденциальности</a>
              <a href="#" className="hover:text-white transition-colors">Условия использования</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

