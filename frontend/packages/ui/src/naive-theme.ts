import type { GlobalThemeOverrides } from 'naive-ui'

export const lostskyNaiveTheme: GlobalThemeOverrides = {
  common: {
    primaryColor: '#006f66',
    primaryColorHover: '#00877b',
    primaryColorPressed: '#00584f',
    primaryColorSuppl: '#007a70',
    infoColor: '#247c91',
    successColor: '#18845d',
    warningColor: '#b16a18',
    errorColor: '#c83f4b',
    borderColor: '#cddad9',
    textColorBase: '#15252b',
    textColor2: '#334950',
    textColor3: '#52666c',
    placeholderColor: '#687a7f',
    placeholderColorDisabled: '#8d999c',
    borderRadius: '10px',
    borderRadiusSmall: '8px',
    fontFamily: '"PingFang SC", "Microsoft YaHei", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: '15px',
  },
  Input: {
    heightSmall: '40px',
    heightMedium: '44px',
    heightLarge: '48px',
    borderRadius: '10px',
    color: '#ffffff',
    colorFocus: '#ffffff',
    border: '1px solid #c7d6d5',
    borderHover: '1px solid #438f89',
    borderFocus: '1px solid #007a70',
    boxShadowFocus: '0 0 0 3px rgba(0, 122, 112, .14)',
    paddingMedium: '0 14px',
  },
  InternalSelection: {
    heightSmall: '40px',
    heightMedium: '44px',
    heightLarge: '48px',
    borderRadius: '10px',
    color: '#ffffff',
    colorActive: '#ffffff',
    border: '1px solid #c7d6d5',
    borderHover: '1px solid #438f89',
    borderActive: '1px solid #007a70',
    boxShadowActive: '0 0 0 3px rgba(0, 122, 112, .14)',
  },
  Button: {
    heightMedium: '44px',
    heightSmall: '40px',
    heightLarge: '48px',
    borderRadiusMedium: '10px',
    borderRadiusSmall: '10px',
    borderRadiusLarge: '10px',
    fontWeight: '600',
  },
  Checkbox: {
    sizeMedium: '19px',
    borderRadius: '5px',
  },
}

/** Named scene for Team settings and notice categories; supplied only by their application root. */
export const lostskyAuroraTheme: GlobalThemeOverrides = {
  ...lostskyNaiveTheme,
  common: {
    ...lostskyNaiveTheme.common,
    primaryColor: '#6ee7c8', primaryColorHover: '#a0f5df', primaryColorPressed: '#43cba8', primaryColorSuppl: '#6ee7c8',
    infoColor: '#8bd7f1', successColor: '#6ee7b7', warningColor: '#edc27a', errorColor: '#ff98a6',
    bodyColor: '#101619', cardColor: '#192125', popoverColor: '#202a2f', modalColor: '#192125',
    borderColor: '#344247', textColorBase: '#edf3f3', textColor1: '#edf3f3', textColor2: '#c0cdce', textColor3: '#a4b5b8',
    placeholderColor: '#a4b5b8', placeholderColorDisabled: '#819397',
  },
  Input: {
    ...lostskyNaiveTheme.Input, color: '#121a1e', colorFocus: '#121a1e',
    border: '1px solid #4b5e64', borderHover: '1px solid #84cfca', borderFocus: '1px solid #6ee7c8', boxShadowFocus: '0 0 0 3px #6ee7c825',
  },
  InternalSelection: {
    ...lostskyNaiveTheme.InternalSelection, color: '#121a1e', colorActive: '#121a1e',
    border: '1px solid #4b5e64', borderHover: '1px solid #84cfca', borderActive: '1px solid #6ee7c8', boxShadowActive: '0 0 0 3px #6ee7c825',
  },
  Button: { ...lostskyNaiveTheme.Button, textColorPrimary: '#062b27', textColorHoverPrimary: '#062b27', textColorPressedPrimary: '#062b27' },
}
