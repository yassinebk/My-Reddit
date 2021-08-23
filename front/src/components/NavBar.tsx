import {
  Box, Button,
  Flex, Heading, HStack,
  Link, useToken
} from "@chakra-ui/react";
import NextLink from "next/link";
import React from "react";
import { useLogoutMutation, useMeQuery } from "../generated/graphql";

interface NavBarProps {}

export const NavBar: React.FC<NavBarProps> = ({}) => {
  const [{ data, fetching }] = useMeQuery();
  const [{ fetching: logoutFetching }, logout] = useLogoutMutation();
  let body = null;

  if (fetching) {
    return body;
  } else if (!data?.me) {
    body = (
      <Box>
        <NextLink href="/login">
          <Link mr={8}>Sign in</Link>
        </NextLink>
        <NextLink href="/register">
          <Link> Sign up</Link>
        </NextLink>
      </Box>
    );
  } else {
    body = (
      <HStack spacing={8} alignItems="center">
        <Box>
          <Heading
            fontSize={["lg", "xl"]}
            color="whiteAlpha.900"
            fontWeight="normal"
            textAlign="right"
          >
            Hi{" "}
            <span
              style={{
                color: useToken("colors", "gray.100"),
                fontStyle: "italic",
                fontWeight: 1200,
              }}
            >
              {data.me.username}
            </span>
          </Heading>
        </Box>
        <NextLink href="/create-post">
          <Button colorScheme="teal" fontWeight="bold" variant="ghost">
            Create post
          </Button>
        </NextLink>

        <Button
          variant="solid"
          colorScheme="red"
          fontSize="sm"
          onClick={() => {
            logout();
          }}
          isLoading={logoutFetching}
        >
          Sign out
        </Button>
      </HStack>
    );
  }
  return (
    <Flex
      position="sticky"
      top={0}
      bg="teal.900"
      py={4}
      ml="auto"
      color="whiteAlpha.800"
      height="fit-content"
      width="full"
      zIndex={1}
      flex={1}

      //      position="sticky"
    >
      <Flex
        maxW={800}
        m="auto"
        justifyContent="space-between"
        width="full"
        px={4}
      >
        <NextLink href="/">
          <Button variant="link">
            <Heading color="orange.400" fontSize="xl">
              My-Reddit
            </Heading>
          </Button>
        </NextLink>
        <>{body}</>
      </Flex>
    </Flex>
  );
};
