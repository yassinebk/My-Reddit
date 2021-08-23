import { DeleteIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  IconButton,
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
import {
  PostSnippetFragment,
  useDeletePostMutation,
  useMeQuery,
  usePostsQuery,
} from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";
import { UpdootSection } from "./UpdootSection";

interface FeatureProps {
  post: PostSnippetFragment;
  currentUserId?: number | null;
}
function Feature({ post, currentUserId, ...rest }: FeatureProps) {
  const [, deletePost] = useDeletePostMutation();
  return (
    <HStack spacing={2} justifyContent="flex-start" width="full">
      <UpdootSection post={post} />
      <Box
        borderWidth={1}
        borderColor={
          currentUserId === post.creatorId ? "whatsapp.300" : undefined
        }
        p={5}
        shadow="md"
        flex="1"
        width="full"
        borderRadius="md"
        {...rest}
      >
        <HStack justify="space-between">
          <VStack alignItems="flex-start" justifyContent="space-between">
            <Heading fontSize="xl">
              <NextLink href="/post/[id]" as={`/post/${post.id}`}>
                <Link>{post.title}</Link>
              </NextLink>
            </Heading>
            <Text>
              posted by {"  "}
              <span style={{ color: useToken("colors", "teal.600") }}>
                {post.creator.username}
              </span>
            </Text>
          </VStack>
          {post.creatorId === currentUserId && (
            <IconButton
              alignSelf="flex-start"
              aria-label="delete-post"
              icon={<DeleteIcon />}
              variant="ghost"
              colorScheme="black"
              onClick={() => {
                deletePost({ id: post.id });
              }}
            />
          )}
        </HStack>

        <Text mt={4}>{post.textSnippet}</Text>
      </Box>
    </HStack>
  );
}

const Index = () => {
  const [{ data: userData }] = useMeQuery();
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
                data.posts.posts.map((p) =>
                  p ? (
                    <Feature
                      currentUserId={userData?.me?.id}
                      key={p.title}
                      post={p}
                    />
                  ) : null
                )
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
              colorScheme="black"
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
