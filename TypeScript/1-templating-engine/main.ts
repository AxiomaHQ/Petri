const routes = [
  {
    path: '/',
    file: 'index.html'
  },
  {
    path: '/inquiry',
    file: 'inquiry.html'
  }
]

const errors = {
  '404': '404.html',
  '500': '500.html'
}

//////////////////////////////////////////////////

const extendBody = (body: string) => {
  const componentFiles = [
    {
      name: 'Component1',
      file: 'Component1.html'
    },
    {
      name: 'Component2',
      file: 'Component2.html'
    },
    {
      name: 'Component3',
      file: 'Component3.html'
    }
  ]

    // Get the content of all the components
  const components = Promise.all(componentFiles.map(async (componentFile) => {
    return {
      name: componentFile.name,
      content: await Deno.readTextFile(componentFile.file)
    }
  }))
}

//////////////////////////////////////////////////

const buildPageHead = (page: string) => {
  const headRegExp = /(?:<Head>)([\s\S]*)(?:<\/Head>)/g

  const head = headRegExp.exec(page)

  return head
    ? head[1]
    : '<title>Error</title>'
}

//////////////////////////////////////////////////

const buildPageBody = (page: string) => {
  const bodyRegExp = /(?:<Template>)([\s\S]*)(?:<\/Template>)/g

  const body = bodyRegExp.exec(page)

  return body
    ? extendBody(body[1])
    : "<h1>Couldn't build the requested page</h1>"
}

//////////////////////////////////////////////////

const mergePageLayout = (layout: string, {head, body}: {head: string, body: string}) => {
    return layout.replace('{{head}}', head).replace('{{body}}', body)
}

//////////////////////////////////////////////////

const processPage = async (file: string) => {
  // Read the layout file and store it as a string
  const layout = await Deno.readTextFile('layout.html')

  // Read the page file and store it as a string
  const page = await Deno.readTextFile(file)

  // Extract the head and the body of the page
  const pageContent: {head: string, body: string} = {
    head: buildPageHead(page),
    body: buildPageBody(page)
  }

  // Build the final page by putting the content on the layout
  const processedPage = mergePageLayout(layout, { ...pageContent })

  return processedPage
}

//////////////////////////////////////////////////

Deno.serve(async (req) => {
  // Get a proper URL object from the request
  const url = new URL(req.url)

  // Find the requested page
  const route = routes.find(route => route.path === url.pathname)

  // Process the requested page or return a 404
  const page: string = await processPage(route?.file || errors[404])

  // Return the processed page
  return new Response(page, {
    headers: new Headers({
      'Content-Type': 'text/html; charset=utf-8'
    })
  })
})
