import bcrypt from 'bcrypt'
import express from 'express'


const app = express()
app.use(express.json())
const users = [
]

app.get('/', (req, res) => {
    res.render('index.html')
})

app.post('/signup', async (req, res) => {
    const { username, password } = req.body
    const hash = await bcrypt.hash(password,10)
    users.push({
        username,
        password: hash
    })

    console.log(users)

    res.send('ok')
})

app.post('/login', async (req, res) => {
    const { username, password } = req.body
    const user = users.find(u => u.username === username)
    if (!user)  {
        res.send("no user")
        return
    }
    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
        res.send("wrong password")
        return
    }

    // cookie
    // jwt token
    res.send(dashboard.html)
})


// Start the listening on specified port
const port = 3000;
app.listen(port, () => {
    console.log(`Web app listening at http://localhost:${port}`)
  });