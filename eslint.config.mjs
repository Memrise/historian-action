import eslint from '@eslint/js'
import {defineConfig} from 'eslint/config'

export default defineConfig(eslint.configs.recommended, {
  languageOptions: {
    parserOptions: {
      projectService: true
    }
  }
})
