/** @type {import('tailwindcss').Config} */
// TailwindCSS 配置 - 新西兰旅行·可爱贴纸手账风格
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // 🍭 手账糖果色主题：薄荷粉+草莓粉+柠檬黄+天空蓝+葡萄紫
      colors: {
        // 主色：薄荷草莓绿
        primary: {
          50:  '#f3fbf3',
          100: '#e3f5e2',
          200: '#c6ebc4',
          300: '#9fdc9c',
          400: '#70c86d',
          500: '#4bb04a',  // 主色
          600: '#359339',
          700: '#2a7330',
          800: '#245c29',
          900: '#1f4c25',
        },
        // 草莓粉
        strawberry: {
          50:  '#fff5f7',
          100: '#ffe4ea',
          200: '#ffcad9',
          300: '#ffa3bd',
          400: '#ff6f96',  // 次主色
          500: '#fb4277',
          600: '#e91e5c',
          700: '#c5144b',
          800: '#a31341',
          900: '#88143c',
        },
        // 天空蓝
        skyblue: {
          50:  '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
        // 柠檬黄
        lemon: {
          50:  '#fffce8',
          100: '#fff7c2',
          200: '#fff087',
          300: '#ffe44a',
          400: '#ffd518',  // 点缀色
          500: '#e6b600',
          600: '#c69000',
        },
        // 葡萄紫
        grape: {
          50:  '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
        },
        // 蜜桃橙
        peach: {
          50:  '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
        },
        // 暖米白（背景）
        cream: {
          50:  '#fffdf7',  // 主背景
          100: '#fff8ea',
          200: '#fff0d1',
          300: '#ffe4ad',
        },
        // 墨水灰（文字）
        ink: {
          400: '#9a958a',
          500: '#7d7768',
          600: '#5b564b',
          700: '#3f3b32',  // 主文字
          800: '#2a2720',
        },
      },
      // 字体：手写感中文字体 + 可爱英文字体
      fontFamily: {
        // 中文：ZCOOL 快乐体 / 站酷快乐体 -> 回退到系统圆体
        sans: [
          '"ZCOOL KuaiLe"',
          '"Mali"',
          '"Quicksand"',
          '"PingFang SC"',
          '"Microsoft YaHei"',
          'system-ui',
          'sans-serif',
        ],
        // 英文手写体：Mali / Patrick Hand
        hand: [
          '"Mali"',
          '"Patrick Hand"',
          '"Caveat"',
          'cursive',
        ],
        // 贴纸标签字体：更圆润可爱
        sticker: [
          '"Baloo 2"',
          '"Quicksand"',
          '"ZCOOL KuaiLe"',
          'sans-serif',
        ],
      },
      // 手账风格：超大圆角、胶带感、厚阴影
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
        '4xl': '2.25rem',
        'blob': '42% 58% 55% 45% / 52% 44% 56% 48%',
      },
      boxShadow: {
        // 贴纸阴影：微倾斜+柔和
        'sticker': '3px 5px 0 rgba(63, 59, 50, 0.12), 2px 4px 14px rgba(63, 59, 50, 0.08)',
        'sticker-lg': '5px 8px 0 rgba(63, 59, 50, 0.14), 4px 10px 22px rgba(63, 59, 50, 0.10)',
        'sticker-sm': '2px 3px 0 rgba(63, 59, 50, 0.10), 1px 2px 6px rgba(63, 59, 50, 0.06)',
        'card': '0 2px 14px -2px rgba(251, 66, 119, 0.08), 0 4px 20px -4px rgba(14, 165, 233, 0.06)',
        'pop': '0 10px 30px -8px rgba(251, 66, 119, 0.25)',
        'washi': '0 1px 0 rgba(0,0,0,0.04), 0 8px 16px -10px rgba(0,0,0,0.15)',
      },
      // 旋转/倾斜（贴纸效果）
      rotate: {
        '1': '1deg',
        '2': '2deg',
        '-1': '-1deg',
        '-2': '-2deg',
      },
      // 动画：弹跳感
      keyframes: {
        wiggle: {
          '0%,100%': { transform: 'rotate(-1deg)' },
          '50%': { transform: 'rotate(1deg)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        pop: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '60%': { transform: 'scale(1.06)', opacity: '1' },
          '100%': { transform: 'scale(1)' },
        },
        sparkle: {
          '0%,100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.25)' },
        },
      },
      animation: {
        wiggle: 'wiggle 2.4s ease-in-out infinite',
        float: 'float 3.5s ease-in-out infinite',
        pop: 'pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
        sparkle: 'sparkle 1.8s ease-in-out infinite',
      },
      // 响应式断点
      screens: {
        'xs': '380px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
      },
    },
  },
  plugins: [],
}
