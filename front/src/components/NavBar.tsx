import { Box, Button, Flex, HStack, Link } from "@chakra-ui/react";
import NextLink from "next/link";
import React from "react";
import { useLogoutMutation, useMeQuery } from "../generated/graphql";
import { isServer } from "../utils/isServer";

interface NavBarProps {}

export const NavBar: React.FC<NavBarProps> = ({}) => {
  const [{ data, fetching }] = useMeQuery({
    pause:isServer() ,
  });
  const [{fetching:logoutFetching},logout] = useLogoutMutation();
  let body = null;

  if (fetching) {
    return body;
  } else if (!data?.me) {
    body = (
      <>
        <NextLink href="/login">
          <Link mr={8}>login</Link>
        </NextLink>
        <NextLink href="/register">
          <Link> Register</Link>
        </NextLink>
      </>
    );
  } else {
      body = <HStack>
          <Box>{data.me.username}</Box>
        <Button variant="link" backgroundColor="red.400" onClick={() => { logout() }} isLoading={logoutFetching}>logout</Button>
      </HStack>;
  }
  return (
    <Flex bg="tomato" p={4} ml="auto">
      <Box ml="auto" color="blue.600" fontSize={18}>
        {body}
      </Box>
    </Flex>
  );
};
