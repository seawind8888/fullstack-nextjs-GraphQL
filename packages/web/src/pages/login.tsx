import * as React from "react"
import cookie from "cookie"
import { gql, useApolloClient } from "@apollo/client"
import { Box, Stack, Heading, Button, Center, Flex } from "@chakra-ui/react"
import Link from "next/link"
import Head from "next/head"
import { useRouter } from "next/router"

import { MeFragmentDoc, LoginInput, MeQuery, MeDocument, useLoginMutation } from "lib/graphql"
import Yup from "lib/yup"
import { Form } from "components/Form"
import { Input } from "components/Input"
import { SESSION_TOKEN } from "lib/config"
import { FormError } from "components/FormError"
import { useForm } from "lib/hooks/useForm"

export const LOGIN = gql`
  mutation Login($data: LoginInput!) {
    login(data: $data) {
      user {
        ...Me
      }
      token
    }
  }
  ${MeFragmentDoc}
`

const LoginSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Required"),
  password: Yup.string().min(8, "Must be at least 8 characters"),
})

export default function Login() {
  const client = useApolloClient()

  const [login, { loading }] = useLoginMutation()
  const router = useRouter()
  const redirectTo = router.query.redirectTo as string | undefined
  const form = useForm({ schema: LoginSchema })

  const onSubmit = (values: LoginInput) => {
    return form.handler(() => login({ variables: { data: values } }), {
      onSuccess: (data) => {
        document.cookie = cookie.serialize(SESSION_TOKEN, data.login.token, {
          path: "/",
          maxAge: 30 * 24 * 60 * 60, // 30 days
        })
        client.writeQuery<MeQuery>({
          query: MeDocument,
          data: { me: data.login.user },
        })
        router.replace(redirectTo || "/")
      },
    })
  }
  return (
    <Center minH="100vh">
      <Head>
        <title>Fullstack boilerplate - Login</title>
      </Head>
      <Box w={["100%", 400]}>
        <Form onSubmit={onSubmit} {...form}>
          <Stack spacing={2}>
            <Heading as="h1">Login</Heading>
            <Input name="email" label="Email" placeholder="jim@gmail.com" />
            <Input name="password" label="Password" type="password" placeholder="********" />
            <Button colorScheme="purple" type="submit" isFullWidth isLoading={loading} isDisabled={loading}>
              Login
            </Button>
            <FormError />
            <Flex justify="space-between">
              <Link href="/register">Register</Link>
              <Link href="/forgot-password">Forgot password?</Link>
            </Flex>
          </Stack>
        </Form>
      </Box>
    </Center>
  )
}
