# AMA - Ask Me Anything

## Projeto realizado em uma trilha do Rocketseat

## Tecnologias usadas

- React
- Typescript
- Go
- PostgreSQL

## Features

[x] Criar e Compartilhar salas
[x] Criar e reagir a perguntas
[x] Se conectar com salas via websocket
[X] Atualização da sala em tempo real
[ ] Ver as respostas
[ ] Responder as perguntas

## Instalação e configuração do projeto

### Backend

- Vá para o diretório server e copie o arquivo `.env.example` para `.env`:

    ```bash
    cd server
    cp .env.example .env
    ```

- Preencha as variables de ambiente de acordo com seu banco de dados
- Se não tiver o Postgres instalado, execute o comando `docker-compose up -d` dentro de server para subir um container com o banco de dados.
- Instale as dependências do projeto:

    ```bash
    go mod tidy
    ```

- Execute o gen.go com o go generate para criar as tabelas no banco de dados:

    ```bash
    go generate ./...
    ```

- Execute o server com o comando `go run main.go`.

### Frontend

- Vá para o diretório web e copie o arquivo `.env.example` para `.env` e verifique se as variáveis de ambiente estão corretas:

    ```bash
    cd web
    cp .env.example .env
    ```

- Instale as dependências do projeto:

    ```bash
    npm install # npm
    ```

- Execute o servidor e acesse o site da aplicação `http://localhost:5173`:

    ```bash
    npm run dev # npm
    ```
