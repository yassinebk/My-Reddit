import { createUrqlClient } from "../utils/createUrqlClient"
import { withUrqlClient } from "next-urql"
import {usePostsQuery} from "../generated/graphql"
import  NextLink  from"next/link"
import React from "react"
import { Box, Link } from "@chakra-ui/react"
import Layout from "../components/Layout"


const Index = () => {
  const [{ data }] = usePostsQuery(); 


  return (
    <Layout>
      <Box>
    <NextLink href="/create-post">
  <Link>
    Create post
    </Link>
  </NextLink>
</Box>
  {!data ? <div>loading ... </div> : data.posts.map((p) => <div key={p.id}>{p.title}</div>)}
  </Layout>

)}

export default withUrqlClient(createUrqlClient,{ssr:true})(Index)
