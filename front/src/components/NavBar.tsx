import { Box, Text, Button, Flex, HStack, Link } from "@chakra-ui/react";
import NextLink from "next/link";
import React from "react";
import { useLogoutMutation, useMeQuery } from "../generated/graphql";
import { isServer } from "../utils/isServer";

interface NavBarProps {}

export const NavBar: React.FC<NavBarProps> = ({}) => {
  const [{ data, fetching }] = useMeQuery({
    pause: isServer(),
  });
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
      <HStack spacing={16}>
        <Text fontSize={"2xl"} color="cyan.100">
          {data.me.username}
        </Text>
        <Button
          variant="link"
          backgroundColor="red.400"
          color="white"
          padding={4}
          onClick={() => {
            logout();
          }}
          isLoading={logoutFetching}
        >
          sign out
        </Button>
      </HStack>
    );
  }
  return (
    <Flex
      bg="teal.900"
      p={4}
      ml="auto"
      color="whiteAlpha.100"
      width="full"
      height="fit-content"
      mb={4}
      zIndex={1}

      //      position="sticky"
    >
      <Box ml="auto" color="white" fontSize={18}>
        {body}
      </Box>
    </Flex>
  );
};
