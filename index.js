import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "permalist",
  password: "1998",
  port: 5432,
});


app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

await db.connect();

let items = [
  { id: 1, title: "Buy milk" },
  { id: 2, title: "Finish homework" },
];

async function build_item() {
  try{
    const result = await db.query("Select * from user_task");
    return result.rows.map(item => ({
      id: item.id,
      title: item.task
    }));
  }catch(err)
  {
    console.log("database connection error : ",err.stack);
    throw err;
  }
}

app.get("/", async(req, res) => {
  try
  {
    items = await build_item();
    res.render("index.ejs", {
      listTitle: "Today",
      listItems: items,
    });
  }catch(error)
  {
    console.error("Error loading items:", error);
    res.status(500).send("Error loading items");
  }
  
});

async function add_task(new_task)
{
  try{
    await db.query("insert into user_task(task) values($1)",[new_task]);
    console.log(`new task ${new_task} is added`);
  }catch(err)
  {
    console.log(err);
    throw(err);
  }
}

app.post("/add", async(req, res) => {
  const item = req.body.newItem;
  try {
    if (!item || item.trim() === '') {
      throw new Error('Task cannot be empty');
    }
    await add_task(item.trim());
    await build_item();
  }catch(err)
  {
    console.log(err);
  }finally
  {
    res.redirect("/");
  }
});

async function update_task(id,new_task)
{
  try{
    await db.query("update user_task set task = $1 where id = $2",[new_task,id]);
    console.log(`task ${id} updated to ${new_task}`);
  }
  catch(err)
  {
    console.log(err);
    throw(err);
  }
}

app.post("/edit", async(req, res) => {
  const new_task = req.body.updatedItemTitle;
  const old_id = req.body.updatedItemId;
  try
  {
    await update_task(old_id,new_task);
    res.redirect("/");
  }
  catch(err)
  {
    console.log(err);
    throw(err);
  }
});

async function delete_task(id)
{
  try{
    await db.query("delete from user_task where id = $1",[id]);
    console.log(`task with id: ${id} is deleted`);
  }catch(err)
  {
    console.log(err);
    throw(err);
  }
}
app.post("/delete", async(req, res) => {
  const id_to_be_deleted = req.body.deleteItemId;
  try{
    await delete_task(id_to_be_deleted);
  }catch(error)
  {
    console.log(err);
    throw(err);
  }finally{
    res.redirect("/");
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
