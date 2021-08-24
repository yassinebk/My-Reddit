import NextDocument, { Html, Head, Main, NextScript } from 'next/document'
import { ColorModeScript } from '@chakra-ui/react'

export default class Document extends NextDocument {
  render() {
    return (

      <Html style={{width:"100vw",height:"100%"}}>

        <Head />
        <body  style={{height:"100%"}}>
          {/* Make Color mode to persists when you refresh the page. */}
          <ColorModeScript initialColorMode="system" />
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}
