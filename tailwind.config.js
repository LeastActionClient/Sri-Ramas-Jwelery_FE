/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Exact Royal Maroon / Burgundy extracted directly from Sri Ramas Jewellery official logo
        burgundy: {
          50: '#FDF5F6',
          100: '#FCEBED',
          200: '#F8D3D8',
          300: '#F0AAB5',
          400: '#E27488',
          500: '#CE425F',
          600: '#AB1F3E',
          700: '#7E112A',
          800: '#54091A', // Royal Maroon
          850: '#420613', // Official Logo Center Backdrop
          900: '#33040E', // Official Logo Deep Texture
          950: '#1F0208', // Vignette Border Tone
        },
        // Exact 3D Crown & Peacock Royal Gold Palette extracted from official logo
        gold: {
          50: '#FCF9EF',
          100: '#F7EFD4',
          200: '#EEDFA7',
          300: '#E4CB75', // Crown & Peacock Highlights
          400: '#D7B142', // Vibrant Feather Gold
          500: '#C39A2E', // Official Logo Typography Gold
          600: '#AA801E', // Antique Gold Midtone
          700: '#876013', // Logo Deep Metallic Shadow
          800: '#5F4109',
          900: '#3E2903',
        },
        ivory: {
          50: '#FAF7F2',
          100: '#F5EFEB',
          200: '#ECE4DC',
          300: '#DFD3C8',
          400: '#BEADA0',
          500: '#9B8779',
          900: '#261F1A',
        },
      },
      fontFamily: {
        serif: ['Cinzel', 'Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      },
      backgroundImage: {
        // Logo-accurate gradient matching the official textured royal background
        'brand-maroon-gradient': 'radial-gradient(ellipse at center, #4A0817 0%, #33040E 60%, #1A0106 100%)',
        // Metallic 3D gold gradient matching the peacock and crown
        'brand-gold-gradient': 'linear-gradient(135deg, #F9E79F 0%, #D4AF37 40%, #AA801E 75%, #876013 100%)',
        'subtle-ivory': 'linear-gradient(180deg, #FFFFFF 0%, #FAF7F2 100%)',
      },
      boxShadow: {
        'luxury': '0 12px 36px -10px rgba(51, 4, 14, 0.35)',
        'luxury-gold': '0 8px 30px -5px rgba(212, 175, 55, 0.3)',
      }
    },
  },
  plugins: [],
};
