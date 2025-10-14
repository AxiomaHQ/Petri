const routes = [
  {
    path: '/',
    file: 'website/index.html'
  },
  {
    path: '/inquiry',
    file: 'website/inquiry.html'
  }
]

const errors = {
  '404': 'website/404.html',
  '500': 'website/500.html'
}

const layoutFile = 'website/layout.html'

// TODO: These should come directly from the file system, linking the component name with a file name.
const componentFiles = [
  {
    name: 'Component1',
    file: 'website/components/component1.html'
  },
  {
    name: 'Component2',
    file: 'website/components/component2.html'
  },
  {
    name: 'Component3',
    file: 'website/components/component3.html'
  }
]

const components = Promise.all(componentFiles.map(async (componentFile) => {
  return {
    name: componentFile.name,
    template: await Deno.readTextFile(componentFile.file)
  }
}))

//////////////////////////////////////////////////
// Build the head of the page

const buildPageHead = (page: string) => {
  const extractHead = (page: string): string => {
    const headRegExp = /(?:<Head>)([\s\S]*)(?:<\/Head>)/g

    const head = headRegExp.exec(page)

    return head
      ? head[1]
      : '<title>Error</title>'
  }

  const expandHead = (head: string): string => {
    // TODO
    return head
  }

  return expandHead(extractHead(page))
}

//////////////////////////////////////////////////
// Build the body of the page

const buildPageBody = async (page: string) => {

  const body = (() => {
    const bodyRegExp = /(?:<Template>)([\s\S]*)(?:<\/Template>)/g
    const body = bodyRegExp.exec(page)

    return body
      ? body[1]
      : "<h1>Couldn't build the requested page</h1>"
  })()

  const componentMatches = (await components).flatMap(component => {
    const componentRegExp = new RegExp('(?:<' + component.name + '>)([\\s\\S]*?)(?:<\\/' + component.name + '>)', 'g')

    const matches = Array.from(body.matchAll(componentRegExp))?.filter(x => x.index).map(match => {
      return {
        name: component.name,
        template: component.template,
        target: match[0],
        expanded: component.template.replace('{{body}}', match[1])
      }
    })

    return matches
      ? matches
      : []
  })


  // TODO: Make it work for nested components
  return componentMatches.reduce((body, instance) => {
    return body.replace(instance.target, instance.expanded)
  }, body)
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
    head: buildPageHead(page),
    body: await buildPageBody(page)
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
