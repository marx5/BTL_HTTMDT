module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true, // Bật lại nếu bạn đang dùng môi trường Node
  },
  globals: {
    process: 'readonly',
  },
  extends: [
    "react-app",
    "react-app/jest",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:prettier/recommended"
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: ['react', 'prettier'],
  rules: {
    'prettier/prettier': 'off',
    'no-console': 'off',
    'quotes': 'off',
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    'react/jsx-uses-react': 'off',
    'react/jsx-uses-vars': 'off',
    'no-unused-vars': 'off',
    "no-useless-catch": "off"
  },
};
