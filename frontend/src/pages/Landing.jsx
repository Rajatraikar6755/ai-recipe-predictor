import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const features = [
  { icon: '🧠', title: 'AI-Powered Recipes', desc: 'GPT-4o generates 3-5 personalized recipes from your exact ingredients.' },
  { icon: '📸', title: 'Photo Recognition', desc: 'Snap a photo of your fridge and let AI identify your ingredients.' },
  { icon: '🥗', title: 'Dietary Filters', desc: 'Filter by vegetarian, vegan, keto, gluten-free, and more.' },
  { icon: '🤖', title: 'Chef AI Chat', desc: 'Ask any cooking question and get expert guidance instantly.' },
  { icon: '❤️', title: 'Save & Organize', desc: 'Save your favorite recipes and build your personal cookbook.' },
  { icon: '📅', title: 'Meal Planner', desc: 'Plan your entire week with recipes tailored to your preferences.' },
];

const floatingIngredients = ['🍅', '🧅', '🫑', '🥕', '🧄', '🫛', '🥦', '🍋'];

export default function Landing() {
  return (
    <div className="min-h-screen bg-dark-950 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-hero-pattern opacity-30 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary-600/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between max-w-6xl mx-auto px-6 py-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center text-xl shadow-glow-sm">
            🍳
          </div>
          <span className="font-display font-bold text-2xl text-white">Chef<span className="gradient-text">AI</span></span>
        </div>
        <Link to="/auth"
          className="btn-primary px-5 py-2.5 text-sm">
          Get Started Free →
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-24 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 bg-primary-500/10 border border-primary-500/20 text-primary-400 px-4 py-1.5 rounded-full text-sm font-medium mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
          </span>
          Powered by GitHub Models + GPT-4o
        </motion.div>

        {/* Floating ingredients */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {floatingIngredients.map((emoji, i) => (
            <motion.div
              key={i}
              className="absolute text-3xl select-none"
              style={{
                left: `${10 + (i * 11)}%`,
                top: `${15 + (i % 3) * 15}%`,
              }}
              animate={{
                y: [0, -15, 0],
                rotate: [0, 5, -5, 0],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 4 + i * 0.5,
                repeat: Infinity,
                delay: i * 0.3,
              }}>
              {emoji}
            </motion.div>
          ))}
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
          Turn Leftovers Into<br />
          <span className="gradient-text">Gourmet Meals</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-dark-300 text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Type or photograph your leftover ingredients and get AI-generated recipes, 
          nutritional breakdowns, and step-by-step cooking guidance — instantly.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/auth?mode=register" className="btn-primary text-lg px-8 py-4 animate-pulse-glow">
            🍳 Start Cooking with AI
          </Link>
          <Link to="/auth" className="btn-secondary text-lg px-8 py-4">
            Sign In
          </Link>
        </motion.div>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center gap-6 mt-10 text-dark-500 text-sm">
          <span>✅ No credit card needed</span>
          <span>·</span>
          <span>✅ Free to start</span>
          <span>·</span>
          <span>✅ 3-5 recipes per search</span>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-24">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-12">
          <h2 className="font-display text-3xl font-bold text-white mb-3">Everything You Need</h2>
          <p className="text-dark-400">A complete AI-powered cooking companion</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6 hover:border-primary-500/20 transition-colors">
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h3 className="font-display font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-dark-400 text-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 pb-24 text-center">
        <div className="glass-card p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-600/10 to-accent-600/10 pointer-events-none" />
          <h2 className="font-display text-3xl font-bold text-white mb-4 relative z-10">
            Ready to Transform Your Kitchen?
          </h2>
          <p className="text-dark-400 mb-8 relative z-10">
            Join thousands of home cooks using AI to reduce food waste and discover amazing recipes.
          </p>
          <Link to="/auth?mode=register" className="btn-primary text-lg px-8 py-4 relative z-10">
            Get Started Free →
          </Link>
        </div>
      </section>
    </div>
  );
}
