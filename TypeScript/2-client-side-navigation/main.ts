const routes = [
  {
    path: '/',
    file: 'index.html'
  },
  {
    path: '/page1',
    file: 'page1.html'
  },
  {
    path: '/page2',
    file: 'page2.html'
  }
]

const errors = {
  '404': '404.html',
  '500': '500.html'
}

const layoutFile = 'layout.html'

//////////////////////////////////////////////////
// Build the head of the page

const getPageHead = (page: string) => {
  const extractHead = (page: string): string => {
    const headRegExp = /(?:<head>)([\s\S]*)(?:<\/head>)/g

    const head = headRegExp.exec(page)

    return head
      ? head[1]
      : '<title>Error</title>'
  }

  const expandHead = (head: string): string => {
    // We can add other kinds of processing here
    return head
  }

  return expandHead(extractHead(page))
}

//////////////////////////////////////////////////
// Build the body of the page

const getPageBody = (page: string) => {

  const body = (() => {
    const bodyRegExp = /(?:<body>)([\s\S]*)(?:<\/body>)/g
    const body = bodyRegExp.exec(page)

    return body
      ? body[1]
      : "<h1>Couldn't build the requested page</h1>"
  })()

  return body
}

//////////////////////////////////////////////////
// Merge the page and the layout

const processPage = async (file: string) => {
  const mergePageLayout = (layout: string, {head, body}: {head: string, body: string}) => {
    return layout.replace('{{head}}', head).replace('{{body}}', body)
  }

  // Read the layout file and store it as a string
  const layout = await Deno.readTextFile(layoutFile)

  // Read the page file and store it as a string
  const page = await Deno.readTextFile(file)

  // Extract the head and the body of the page
  const pageContent: {head: string, body: string} = {
    head: getPageHead(page),
    body: getPageBody(page)
  }

  // Build the final page by putting the content on the layout
  return mergePageLayout(layout, { ...pageContent })
}

//////////////////////////////////////////////////
// Serve the website

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
