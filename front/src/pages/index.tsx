import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Link,
  Spinner,
  Text,
  useToken,
  VStack,
} from "@chakra-ui/react";
import { withUrqlClient } from "next-urql";
import NextLink from "next/link";
import React, { useState } from "react";
import { NavBar } from "../components/NavBar";
import { Wrapper } from "../components/Wrapper";
import { PostSnippetFragment, usePostsQuery } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";
import { UpdootSection } from "./UpdootSection";

interface FeatureProps {
  post: PostSnippetFragment;
}
function Feature({ post, ...rest }: FeatureProps) {
  return (
    <HStack spacing={2} justifyContent="flex-start" width="full">
      <UpdootSection post={post} />
      <Box
        p={5}
        shadow="md"
        borderWidth="1px"
        flex="1"
        width="full"
        borderRadius="md"
        {...rest}
      >
        <VStack alignItems="flex-start" justifyContent="space-between">
          <Heading fontSize="xl">
            <NextLink href="/post/[id]" as={`/post/${post.id}`}>
              <Link>{post.title}</Link>
            </NextLink>
          </Heading>
          <Text>
            posted by
            <span style={{ color: useToken("colors", "teal.600") }}>
              {post.creator.username}
            </span>
          </Text>
        </VStack>
        <Text mt={4}>{post.textSnippet}</Text>
      </Box>
    </HStack>
  );
}

const Index = () => {
  const [variables, setVariables] = useState({
    limit: 15,
    cursor: null as null | string,
  });
  const [{ fetching, data }] = usePostsQuery({
    variables,
  });

  if (!fetching && !data) {
    return <Heading color="tomato">Website down , reload page</Heading>;
  }
  return (
    <Box backgroundColor="whiteAlpha.100">
      <NavBar />
      <Wrapper variant="regular">
        <Box backgroundColor="whiteAlpha.100">
          <Flex width="full" justifyContent="space-between">
            <Heading color="tomato">My-Reddit</Heading>
            <NextLink href="/create-post">
              <Button
                mb="4"
                width="50%"
                colorScheme="teal"
                fontWeight="bold"
                variant="solid"
              >
                Create post
              </Button>
            </NextLink>
          </Flex>
          <br />
          {fetching && !data ? (
            <Spinner
              thickness="4px"
              speed="0.65s"
              emptyColor="gray.200"
              color="blue.500"
              size="xl"
            />
          ) : (
            <VStack spacing={8}>
              {!data ? (
                <Text fontSize="3xl">no data to display ... </Text>
              ) : (
                data.posts.posts.map((p) => <Feature key={p.title} post={p} />)
              )}
            </VStack>
          )}
        </Box>
        {data && data.posts.hasMore ? (
          <Flex justifyContent="flex-end" mt={15}>
            <Button
              isLoading={fetching}
              variant="solid"
              borderColor="gray.100"
              borderWidth={3}
              colorScheme="blackAlpha"
              onClick={() => {
                setVariables({
                  limit: variables.limit,
                  cursor:
                    data.posts.posts[data.posts.posts.length - 1].createdAt,
                });
              }}
            >
              Load more ..
            </Button>
          </Flex>
        ) : null}
      </Wrapper>
    </Box>
  );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
