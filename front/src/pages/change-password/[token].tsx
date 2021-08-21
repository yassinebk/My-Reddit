import React, { useState } from "react";
import { NextPage } from "next";
import { Wrapper } from "../../components/Wrapper";
import { Link,Box, Button,Flex } from "@chakra-ui/react";
import { Formik, Form } from "formik";
import  InputField  from "../../components/InputField";
import { toErrorMap } from "../../utils/toErrorMap";
import { useChangePasswordMutation } from "../../generated/graphql";
import  NextLink   from "next/link";
import { useRouter } from "next/dist/client/router";
import { createUrqlClient } from "../../utils/createUrqlClient";
import { withUrqlClient } from "next-urql";

export const ChangePassword: NextPage = () => {
  const router = useRouter();
  const [, changePassword] = useChangePasswordMutation();
  const [tokenError, setTokenError] = useState("");
  return (
    <Wrapper variant="small">
      <Formik
        initialValues={{
          newPassword: "",
        }}
        onSubmit={async (values, { setErrors }) => {
          const response = await changePassword({
            token:typeof router.query.token ==='string'?router.query.token:"",
            newPassword: values.newPassword,
          });

          console.log(response);
          if (response.data?.changePassword.errors) {
            const errorMap = toErrorMap(response.data.changePassword.errors);
            console.log(errorMap.token);
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
            <Box mt={4} >
              <InputField
                name="newPassword"
                placeholder="new password"
                label="New password"
                type="password"
                required
              />
              { tokenError && <Flex color="red.600" justifyContent="space-between"paddingLeft="1" marginTop="2" fontSize="medium" >
                {tokenError + '   '}
                <NextLink href="/forgot-password" >
                  <Link colorScheme="blackAlpha" color="black">     send a forget password request again </Link>
                </NextLink>
              </Flex>}
             
            </Box>
            <Button
              type="submit"
              mt={4}
              isLoading={isSubmitting}
              colorScheme="teal"
            >
              Change password
            </Button>
          </Form>
        )}
      </Formik>
    </Wrapper>
  );
};

export default withUrqlClient(createUrqlClient,{ssr:false})(ChangePassword);

