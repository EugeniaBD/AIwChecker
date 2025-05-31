// File: src/components/Footer.js
import React from 'react';

function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-800 text-white py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h2 className="text-xl font-bold">AIWriteCheck</h2>
            <p className="text-gray-300 text-sm">Improve your writing with AI detection</p>
          </div>
          
          <div className="flex space-x-4">
            <a href="#" className="text-gray-300 hover:text-white">
              <i className="fab fa-twitter text-xl"></i>
            </a>
            <a href="#" className="text-gray-300 hover:text-white">
              <i className="fab fa-facebook text-xl"></i>
            </a>
            <a href="#" className="text-gray-300 hover:text-white">
              <i className="fab fa-linkedin text-xl"></i>
            </a>
          </div>
        </div>
        
        <div className="mt-6 border-t border-gray-700 pt-6 text-center text-sm text-gray-400">
          <p>&copy; {currentYear} AIWriteCheck. All rights reserved.</p>
          <div className="mt-2 flex justify-center space-x-4">
            <a href="#" className="hover:text-white">Privacy Policy</a>
            <a href="#" className="hover:text-white">Terms of Service</a>
            <a href="#" className="hover:text-white">Contact Us</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

