import users from '../../data/users.json'
import { defineEventHandler, readBody } from 'h3'

const handler = defineEventHandler(async (event) => {
  try {
    const credentials = await readBody(event)
    const user = users.find(u => u.email === credentials.email)

    if (!user || user.password !== credentials.password) {
      event.node.res.statusCode = 401
      return { error: 'Невірний логін або пароль' }
    }

    const token = `mock_token_${user.id}_${Date.now()}`

    return {
      token: token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar: user.avatar
      }
    }
  } catch (e) {
    console.error(e)
    event.node.res.statusCode = 500
    return { error: 'Internal Server Error' }
  }
})

export default handler
