const express = require('express');
const fs = require('fs');
const app = express();
const path = require('path');
const port = 3000;
const userDBPath = path.join(__dirname, 'users.json');
const Joi = require('joi');

app.use(express.json());

// Схема данных для валидации
const userSchema = Joi.object({
    firstName: Joi.string().min(2).max(30).required(),
    secondName: Joi.string().min(2).required(),
    age: Joi.number().integer().min(1).required(),
    city: Joi.string().min(2).required()
});

// Middleware для валидации данных пользователя
function validateUserData(req, res, next) {
    const { error } = userSchema.validate(req.body);
    if (error) {
        return res.status(400).send({ error: error.details[0].message });
    }
    next();
}

////////  1. запрос всех пользователей
app.get('/users', (req, res) => {
    const users = JSON.parse(fs.readFileSync(userDBPath));
    res.send({ users });
})

//////// 2. запрос пользователя ///////////
app.get('/users/:id', (req, res) => {
    const userId = Number(req.params.id);
    // console.log('Идентификатор пользователя:', userId); // Выводим идентификатор пользователя для отладки

    const users = JSON.parse(fs.readFileSync(userDBPath));
    // console.log('Данные о пользователях из файла:', usersData); // Выводим данные о пользователях для отладки

    const user = users.find(user => user.id === userId);
    // console.log('Найденный пользователь:', user); // Выводим найденного пользователя для отладки

    if (!user) {
        return res.status(404).send({ error: 'Пользователь не найден' });
    }

    res.send({ user });
});

//////// 3. запрос на обновление пользователя ///////////
app.put('/users/:id', validateUserData, (req, res) => {
    const userId = Number(req.params.id);
    const newData = req.body;

    let usersData = JSON.parse(fs.readFileSync(userDBPath));

    const userIndex = usersData.findIndex(user => user.id === userId);

    if (userIndex === -1) {
        return res.status(404).send({ error: 'Пользователь не найден' });
    }

    // Обновляем данные пользователя
    usersData[userIndex] = { id: userId, ...newData };

    // Записываем обновленные данные о пользователях обратно в файл
    fs.writeFileSync(userDBPath, JSON.stringify(usersData, null, 2));

    res.send({ message: `Данные пользователя с id ${userId} успешно обновлены`, user: usersData[userIndex] });
});


//////// 4. запрос на удаление пользователя ///////////
app.delete('/users/:id', (req, res) => {
    const userId = Number(req.params.id);

    let usersData = JSON.parse(fs.readFileSync(userDBPath));

    const userIndex = usersData.findIndex(user => user.id === userId);

    if (userIndex === -1) {
        return res.status(404).send({ error: 'Пользователь не найден' });
    }

    // Удаление пользователя из массива
    usersData = usersData.filter(user => user.id !== userId);

    // Сохранение обновленных данных в файл
    fs.writeFileSync(userDBPath, JSON.stringify(usersData, null, 2));

    res.send({ message: `Пользователь ${userId} успешно удален` });
});


/////////// 5. запрос на добавление нового пользователя ////
app.post('/users', validateUserData, (req, res) => {
    const newUser = req.body; // Получаем данные нового пользователя из тела запроса

    // Читаем текущие данные о пользователях из файла
    let usersData = JSON.parse(fs.readFileSync(userDBPath));

    // Генерируем новый идентификатор для нового пользователя
    const newUserId = usersData.length > 0 ? Math.max(...usersData.map(user => user.id)) + 1 : 1;

    // Присваиваем новому пользователю сгенерированный идентификатор
    newUser.id = newUserId;

    // Добавляем нового пользователя в массив с данными о пользователях
    usersData.push(newUser);

    // Записываем обновленные данные о пользователях обратно в файл
    fs.writeFileSync(userDBPath, JSON.stringify(usersData, null, 2));

    // Отправляем ответ с сообщением о успешном добавлении пользователя
    res.status(201).send({ message: `Пользователь ${newUser.firstName} ${newUser.secondName} успешно добавлен`, user: newUser });
});

//////////////////// запуск сервера ////////////////////////////
app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
});

