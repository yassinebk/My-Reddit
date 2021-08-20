import React from "react";
import { Formik, Form } from "formik";
import { Box } from "@chakra-ui/layout";
import { Wrapper } from "../components/Wrapper";
import { InputField } from "../components/InputField";
import { Button } from "@chakra-ui/react";
import { useLoginMutation} from "../generated/graphql"
import { toErrorMap } from "../utils/toErrorMap";
import { useRouter } from "next/dist/client/router";
import { withUrqlClient } from "next-urql";
import { createUrqlClient } from "../utils/createUrqlClient";

interface loginProps {}


const Login: React.FC<loginProps> = ({}) => {
  const router = useRouter();
  const [, login] = useLoginMutation();
  

  return (
    <Wrapper>
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
              //worked
              router.push("/");
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

export default withUrqlClient(createUrqlClient) (Login);
