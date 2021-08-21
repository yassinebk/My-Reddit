import React from "react";
import { Formik, Form } from "formik";
import { Box, Flex } from "@chakra-ui/react";
import Layout from "../components/Layout";
import  InputField  from "../components/InputField";
import { Button, Link } from "@chakra-ui/react";
import { useLoginMutation} from "../generated/graphql"
import { toErrorMap } from "../utils/toErrorMap";
import { useRouter } from "next/dist/client/router";
import { withUrqlClient } from "next-urql";
import { createUrqlClient } from "../utils/createUrqlClient";
import NextLink from "next/link";

interface loginProps {}


const Login: React.FC<loginProps> = ({}) => {
  const router = useRouter();
  const [, login] = useLoginMutation();
  

  return (
    <Layout variant="regular">
      <Formik
        initialValues={{
          usernameOrEmail: "",
          password:""
        }}
        onSubmit={
          async (values, { setErrors }) => {
          
            const response = await login({ usernameOrEmail: values.usernameOrEmail, password: values.password });

            console.log(response);
            if (response.data?.login.errors) {
              setErrors( toErrorMap(response.data.login.errors))
            }
            else if (response.data?.login.user) {
              if (typeof router.query.next === 'string')
                router.push(router.query.next);
              else router.push("/");//worked 
            }
          }
        }
      >
        {({ isSubmitting }) => (
          <Form>
            <InputField
              name="usernameOrEmail"
              required
              placeholder="username or email"
              label="Username Or Email"
            />
            <Box mt={4}>
              <InputField
                name="password"
                placeholder="password"
                label="Password"
                type="password"
                required
              />
            </Box>
            <Flex mt="3">
              <NextLink href="/forgot-password">
              <Link ml="auto" textDecoration="underline" ButtonHighlight>Forgot password ? </Link>
              </NextLink>
            </Flex>

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
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient) (Login);
