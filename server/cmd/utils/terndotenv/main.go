package main

import (
	"bytes"
	"fmt"
	"os/exec"

	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		panic(err)
	}

	cmd := exec.Command(
		"tern",
		"migrate",
		"--migrations",
		"./internal/pgstore/migrations",
		"--config",
		"./internal/pgstore/migrations/tern.conf",
	)

	var out bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &out

	if err := cmd.Run(); err != nil {
		fmt.Printf("Error: %s\n", err)
		fmt.Printf("Output: %s\n", out.String())
		panic(err)
	}

	fmt.Println("Migrations executed successfully.")
}
