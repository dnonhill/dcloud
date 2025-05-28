import { configure } from '@storybook/react'

const req = require.context('../src', true, /.stories.tsx$/)

function loadStories() {
  req.keys().forEach(req)
  require('bulma/css/bulma.css')
}

configure(loadStories, module)