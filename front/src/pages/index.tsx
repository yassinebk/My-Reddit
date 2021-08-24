import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Link,
  Spinner,
  Text,
  useColorModeValue,
  useToken,
  VStack,
} from "@chakra-ui/react";
import { withUrqlClient } from "next-urql";
import NextLink from "next/link";
import React, { useState } from "react";
import { EditDeletePostButtons } from "../components/EditDeletePostButtons";
import { NavBar } from "../components/NavBar";
import { Wrapper } from "../components/Wrapper";
import {
  PostSnippetFragment,
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
  return (
    <HStack spacing={2} justifyContent="flex-start" width="full">
      <UpdootSection post={post} authorized={!!currentUserId} />
      <HStack
        borderWidth={1}
        borderColor={
          currentUserId === post.creatorId ? "whatsapp.300" : undefined
        }
        p={5}
        shadow="md"
        flex="1"
        width="full"
        justifyContent="space-between"
        borderRadius="md"
        {...rest}
      >
        <VStack
          alignItems="flex-start"
          justifyContent="space-between"
          spacing={8}
        >
          <Flex direction="column" justifyContent="flex-start" textAlign="left">
            <Heading fontSize="xl" textAlign="left">
              <NextLink href="/post/[id]" as={`/post/${post.id}`}>
                <Link>{post.title}</Link>
              </NextLink>
            </Heading>
            <Text fontSize="sm" mt={2} fontWeight="light" fontStyle="italic">
              posted by {"  "}
              <span style={{ color: useToken("colors", "teal.600") }}>
                {post.creator.username}
              </span>
            </Text>
          </Flex>
          <Text mt={4}>{post.textSnippet}</Text>
        </VStack>

        {post.creatorId === currentUserId && (
          <Box alignSelf="flex-start">
            <EditDeletePostButtons post={post} />
          </Box>
        )}
      </HStack>
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
  const bg = useColorModeValue("gray.50", "gray.900");
  const color = useColorModeValue("gray.900", "gray.50");

  return (
    <Box backgroundColor={bg} color={color}>
      <NavBar />
      <Wrapper variant="regular">
        <Box>
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
              colorScheme="gray"
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
