export default function Footer() {
  return (
    <footer className="bg-zinc-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-medium mb-4">CUSTOMER CARE</h3>
            <ul className="space-y-2 text-sm text-zinc-300">
              <li>Shipping Information</li>
              <li>Returns & Exchanges</li>
              <li>Lifetime Warranty</li>
              <li>Size Guide</li>
              <li>FAQ</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-4">JEWELRY</h3>
            <ul className="space-y-2 text-sm text-zinc-300">
              <li>Custom Bracelets</li>
              <li>Custom Necklaces</li>
              <li>Custom Earrings</li>
              <li>Design Gallery</li>
              <li>Materials Guide</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-4">CONTACT</h3>
            <ul className="space-y-2 text-sm text-zinc-300">
              <li>hello@jove.com</li>
              <li>1-800-JOVE-123</li>
              <li>Live Chat Support</li>
              <li>Design Consultation</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-4">COMPANY</h3>
            <ul className="space-y-2 text-sm text-zinc-300">
              <li>Our Story</li>
              <li>Sustainability</li>
              <li>Reviews</li>
              <li>Careers</li>
              <li>Press</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-zinc-700 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-center text-sm text-zinc-400 mb-4 md:mb-0">
              © Jové Jewellers 2025 - Crafting Your Story Online
            </div>
            <div className="flex space-x-6 text-sm text-zinc-400">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
