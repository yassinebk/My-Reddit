import React, { useState } from "react";
import { NextPage } from "next";
import { Wrapper } from "../../components/Wrapper";
import { Box, Button, FormErrorMessage } from "@chakra-ui/react";
import { Formik, Form } from "formik";
import { InputField } from "../../components/InputField";
import { toErrorMap } from "../../utils/toErrorMap";
import { useChangePasswordMutation } from "../../generated/graphql";
import { useRouter } from "next/dist/client/router";
import { createUrqlClient } from "../../utils/createUrqlClient";
import { withUrqlClient } from "next-urql";

export const ChangePassword: NextPage<{ token: string }> = ({ token }) => {
  const router = useRouter();
  const [, changePassword] = useChangePasswordMutation();
  const [tokenError, setTokenError] = useState("");
  return (
    <Wrapper>
      <Formik
        initialValues={{
          newPassword: "",
        }}
        onSubmit={async (values, { setErrors }) => {
          const response = await changePassword({
            token,
            newPassword: values.newPassword,
          });

          console.log(response);
          if (response.data?.changePassword.errors) {
            const errorMap = toErrorMap(response.data.changePassword.errors);
            if ("token" in errorMap) {
              setTokenError(errorMap.token);
            } else {
              setErrors(errorMap);
            }
          } else if (response.data?.changePassword.user) {
            //worked
            router.push("/");
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <Box mt={4}>
              <InputField
                name="newPassword"
                placeholder="new password"
                label="newPassword"
                type="password"
                required
              />
              <FormErrorMessage color="red.600" >{tokenError}</FormErrorMessage>
            </Box>
            <Button
              type="submit"
              mt={4}
              isLoading={isSubmitting}
              colorScheme="teal"
            >
              register
            </Button>
          </Form>
        )}
      </Formik>
    </Wrapper>
  );
};

ChangePassword.getInitialProps = ({ query }) => {
  return {
    token: query.token as string,
  };
};

export default withUrqlClient(createUrqlClient,{ssr:false})(ChangePassword);

