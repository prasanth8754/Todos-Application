const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const dbPath = path.join(__dirname, 'todoApplication.db')
const app = express()
app.use(express.json())

// initializing and connecting database...
let db = null
const initializingDB = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () =>
      console.log('Server Running at http://localhost:3000/'),
    )
  } catch (err) {
    console.log(`DB ERROR: ${err.message}`)
    process.exit(1)
  }
}
initializingDB()

// API 1
const hasPriorityAndStatus = (priority, status) => {
  return priority !== undefined && status !== undefined
}

const hasStatus = status => {
  return status !== undefined
}

const hasPriority = priority => {
  return priority !== undefined
}

app.get('/todos/', async (request, response) => {
  const {status, priority, search_q = ''} = request.query

  let getTodoQuery

  switch (true) {
    case hasPriorityAndStatus(priority, status):
      getTodoQuery = `SELECT * FROM todo WHERE status == "${status}" AND priority == "${priority}";`
      break

    case hasStatus(status):
      getTodoQuery = `SELECT * FROM todo WHERE status == "${status}";`
      break

    case hasPriority(priority):
      getTodoQuery = `SELECT * FROM todo WHERE priority == "${priority}";`
      break

    default:
      getTodoQuery = `SELECT * FROM todo WHERE todo LIKE "%${search_q}%";`
      break
  }

  const todoList = await db.all(getTodoQuery)
  response.send(todoList)
})

// api 2 ...Returns a specific todo based on the todo ID

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params

  let getTodoQuery = `
  SELECT * FROM todo WHERE id == ${todoId}
  `

  const todoList = await db.all(getTodoQuery)
  response.send(todoList[0])
})

//Create a todo in the todo table (API 3)

app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status} = request.body

  let createTodoQuery = `
   INSERT INTO todo(id,todo,priority,status)
   values (${id},"${todo}","${priority}","${status}")
  ;`

  await db.run(createTodoQuery)
  response.send('Todo Successfully Added')
})

//Updates the details of a specific todo based on the todo ID (API 4)

app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const {status, priority, todo} = request.body

  let updateTodoQuery
  let state

  switch (true) {
    case hasStatus(status):
      updateTodoQuery = `UPDATE todo SET status = "${status}"
      WHERE id = ${todoId};`
      state = 'Status'
      break

    case hasPriority(priority):
      updateTodoQuery = `UPDATE todo SET priority = "${priority}" 
      WHERE id = ${todoId};`
      state = 'Priority'
      break

    default:
      updateTodoQuery = `UPDATE todo SET todo = "${todo}" 
      WHERE id = ${todoId};`
      state = 'Todo'
      break
  }

  await db.run(updateTodoQuery)
  response.send(`${state} Updated`)
})

//Deletes a todo from the todo table based on the todo ID

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params

  let deleteTodoQuery = `
   DELETE 
   FROM 
   todo
   WHERE id = ${todoId}
  ;`

  await db.run(deleteTodoQuery)
  response.send('Todo Deleted')
})

module.exports = app
