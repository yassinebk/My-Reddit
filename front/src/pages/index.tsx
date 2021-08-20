import { Box } from "@chakra-ui/layout"
import { NavBar } from "../components/NavBar"
import { createUrqlClient } from "../utils/createUrqlClient"
import { withUrqlClient } from "next-urql"
import {usePostsQuery} from "../generated/graphql"


const Index = () => {
  const [{ data }] = usePostsQuery(); 


return(  <Box>
    <NavBar/>
  {!data ? <div>loading ... </div> : data.posts.map((p) => <div key={p.id}>{p.title}</div>)}
  </Box>

)}

export default withUrqlClient(createUrqlClient,{ssr:true})(Index)
