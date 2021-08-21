import {
  Box,
  Button,
  Flex,
  Heading,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { withUrqlClient } from "next-urql";
import NextLink from "next/link";
import React, { useState } from "react";
import { NavBar } from "../components/NavBar";
import { Wrapper } from "../components/Wrapper";
import { usePostsQuery } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";

interface FeatureProps {
  title: string;
  desc: string;
}
function Feature({ title, desc, ...rest }: FeatureProps) {
  return (
    <Box
      p={5}
      shadow="md"
      borderWidth="1px"
      flex="1"
      width="full"
      borderRadius="md"
      {...rest}
    >
      <Heading fontSize="xl">{title}</Heading>
      <Text mt={4}>{desc}</Text>
    </Box>
  );
}

const Index = () => {
  const [variables, setVariables] = useState({
    limit: 10,
    cursor: null as null | string,
  });
  const [{ fetching, data }] = usePostsQuery({
    variables,
  });
  console.log("data", data);

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
                data.posts.posts.map((p) => (
                  <Feature key={p.title} title={p.title} desc={p.textSnippet} />
                ))
              )}
            </VStack>
          )}
        </Box>
        {data && data.posts.hasMore ? (
          <Flex justifyContent="flex-end" mt={15}>
            <Button
              isLoading={fetching}
              onClick={() => {
                console.log(
                  "createdAt",
                  data.posts.posts[data.posts.posts.length - 1].createdAt
                );
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

export default withUrqlClient(createUrqlClient, { ssr: false })(Index);
