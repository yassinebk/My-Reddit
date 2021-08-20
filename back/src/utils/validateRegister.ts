import { UsernamePasswordInput } from "src/resolvers/user";

export const validateRegister = (options: UsernamePasswordInput) => {

    console.log(options)
    if (!options.email?.includes("@")) {
        return [
            {
                field: "email",
                message: "invalid email",
            },
        ]
    }
    if (options.username.length <= 2) {
        return [
            {
                field: "username",
                message: "username shouldn't be less than 2 characters",
            },
        ]

    }
    if (options.password.length < 2) {
        return [
            {
                field: "password",
                message: "password shouldn't be empty",
            },
        ]
    }
    return null;
}