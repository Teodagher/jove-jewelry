'use client'

import { useState } from 'react'

export default function Footer() {
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({})

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  return (
    <footer className="bg-[#111] text-[#eee] py-16 px-8" style={{ fontFamily: 'Arial, sans-serif' }}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        
        {/* CUSTOMER CARE */}
        <div className="footer-section">
          <h4 className="text-base mb-5 uppercase text-white font-normal">CUSTOMER CARE</h4>
          <ul className="list-none p-0 m-0 space-y-3">
            {/* Shipping Information */}
            <li className="text-sm">
              <button 
                onClick={() => toggleSection('shipping')}
                className="flex items-center justify-between w-full text-left hover:text-[#f5c542] transition-colors"
              >
                <strong>Shipping Information</strong>
                <span className="ml-2 text-xs">
                  {expandedSections.shipping ? '−' : '+'}
                </span>
              </button>
                             {expandedSections.shipping && (
                 <div className="mt-3 pl-4 py-2 text-xs text-[#ccc] border-l-2 border-[#333]">
                   Delivery available all over Lebanon. Standard delivery takes 3-5 business days. Express delivery available for urgent orders.
                 </div>
               )}
            </li>

            {/* Returns & Exchanges */}
            <li className="text-sm">
              <button 
                onClick={() => toggleSection('returns')}
                className="flex items-center justify-between w-full text-left hover:text-[#f5c542] transition-colors"
              >
                <strong>Returns & Exchanges</strong>
                <span className="ml-2 text-xs">
                  {expandedSections.returns ? '−' : '+'}
                </span>
              </button>
                             {expandedSections.returns && (
                 <div className="mt-3 pl-4 py-2 text-xs text-[#ccc] border-l-2 border-[#333]">
                   You can exchange or return your product if, upon delivery, it doesn't meet your requirements. Returns must be initiated within 30 days of delivery. Items must be in original condition.
                 </div>
               )}
            </li>

            {/* Lifetime Warranty */}
            <li className="text-sm">
              <button 
                onClick={() => toggleSection('warranty')}
                className="flex items-center justify-between w-full text-left hover:text-[#f5c542] transition-colors"
              >
                <strong>Lifetime Warranty</strong>
                <span className="ml-2 text-xs">
                  {expandedSections.warranty ? '−' : '+'}
                </span>
              </button>
                             {expandedSections.warranty && (
                 <div className="mt-3 pl-4 py-2 text-xs text-[#ccc] border-l-2 border-[#333]">
                   If any of our products come with a manufacturer defect, you are fully covered with a lifetime warranty. This covers material defects and craftsmanship issues.
                 </div>
               )}
            </li>

            {/* Size Guide */}
            <li className="text-sm">
              <button 
                onClick={() => toggleSection('sizeGuide')}
                className="flex items-center justify-between w-full text-left hover:text-[#f5c542] transition-colors"
              >
                <strong>Size Guide</strong>
                <span className="ml-2 text-xs">
                  {expandedSections.sizeGuide ? '−' : '+'}
                </span>
              </button>
            </li>
          </ul>

                     {/* SIZE GUIDE TABLE */}
           {expandedSections.sizeGuide && (
             <div className="mt-4 overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr>
                    <th className="border border-[#444] p-1.5 text-center bg-[#222] text-white">US Size</th>
                    <th className="border border-[#444] p-1.5 text-center bg-[#222] text-white">Inside Diameter (mm)</th>
                    <th className="border border-[#444] p-1.5 text-center bg-[#222] text-white">Inside Circumference (mm)</th>
                    <th className="border border-[#444] p-1.5 text-center bg-[#222] text-white">EU Size</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="border border-[#444] p-1.5 text-center">5</td><td className="border border-[#444] p-1.5 text-center">15.7</td><td className="border border-[#444] p-1.5 text-center">49.3</td><td className="border border-[#444] p-1.5 text-center">49</td></tr>
                  <tr><td className="border border-[#444] p-1.5 text-center">6</td><td className="border border-[#444] p-1.5 text-center">16.5</td><td className="border border-[#444] p-1.5 text-center">51.9</td><td className="border border-[#444] p-1.5 text-center">52</td></tr>
                  <tr><td className="border border-[#444] p-1.5 text-center">7</td><td className="border border-[#444] p-1.5 text-center">17.3</td><td className="border border-[#444] p-1.5 text-center">54.4</td><td className="border border-[#444] p-1.5 text-center">54</td></tr>
                  <tr><td className="border border-[#444] p-1.5 text-center">8</td><td className="border border-[#444] p-1.5 text-center">18.1</td><td className="border border-[#444] p-1.5 text-center">57.0</td><td className="border border-[#444] p-1.5 text-center">57</td></tr>
                  <tr><td className="border border-[#444] p-1.5 text-center">9</td><td className="border border-[#444] p-1.5 text-center">18.9</td><td className="border border-[#444] p-1.5 text-center">59.5</td><td className="border border-[#444] p-1.5 text-center">60</td></tr>
                  <tr><td className="border border-[#444] p-1.5 text-center">10</td><td className="border border-[#444] p-1.5 text-center">19.8</td><td className="border border-[#444] p-1.5 text-center">62.1</td><td className="border border-[#444] p-1.5 text-center">62</td></tr>
                  <tr><td className="border border-[#444] p-1.5 text-center">11</td><td className="border border-[#444] p-1.5 text-center">20.6</td><td className="border border-[#444] p-1.5 text-center">64.6</td><td className="border border-[#444] p-1.5 text-center">65</td></tr>
                  <tr><td className="border border-[#444] p-1.5 text-center">12</td><td className="border border-[#444] p-1.5 text-center">21.4</td><td className="border border-[#444] p-1.5 text-center">67.2</td><td className="border border-[#444] p-1.5 text-center">67</td></tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

                 {/* JEWELRY */}
         <div className="footer-section">
           <h4 className="text-base mb-5 uppercase text-white font-normal">JEWELRY</h4>
           <ul className="list-none p-0 m-0 space-y-3">
            <li className="text-sm">Custom Bracelets</li>
            <li className="text-sm">Custom Necklaces</li>
            <li className="text-sm">Custom Rings</li>
          </ul>
        </div>

                 {/* MATERIAL GUIDE */}
         <div className="footer-section">
           <h4 className="text-base mb-5 uppercase text-white font-normal">MATERIAL GUIDE</h4>
           <p className="text-sm m-0 leading-relaxed">We only use <strong>18kt gold</strong> for all our creations.</p>
        </div>

                 {/* CONTACT */}
         <div className="footer-section">
           <h4 className="text-base mb-5 uppercase text-white font-normal">CONTACT</h4>
           <ul className="list-none p-0 m-0 space-y-3">
            <li className="text-sm">Email: <a href="mailto:support@maisonjove.com" className="text-[#f5c542] no-underline hover:underline">support@jové.com</a></li>
            <li className="text-sm">Phone/WhatsApp: <a href="tel:+96171777422" className="text-[#f5c542] no-underline hover:underline">+961 71 777 422</a></li>
          </ul>
        </div>

      </div>
    </footer>
  )
}
