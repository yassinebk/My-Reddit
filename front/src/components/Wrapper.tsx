import React from "react";
import { Box } from "@chakra-ui/layout";

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
      height="auto"
      backgroundColor="whiteAlpha.100"
      py={8}
    >
      {children}
    </Box>
  );
};
