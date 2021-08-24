import React from "react";
import { Box } from "@chakra-ui/layout";
import { useColorModeValue } from "@chakra-ui/react";

export type WrapperVariant = "small" | "regular";
interface WrapperProps {
  variant?: WrapperVariant;
}

export const Wrapper: React.FC<WrapperProps> = ({
  children,
  variant = "regular",
}) => {
  return (
    <Box
      px={4}
      maxW={variant === "regular" ? "800px" : "400px"}
      mt={16}
      width="100%"
      mx="auto"
      py={8}
    >
      {children}
    </Box>
  );
};
