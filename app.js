import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";

const pool = mysql.createPool({
  host: "localhost",
  user: "sbsst",
  password: "sbs123414",
  database: "WS",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
});

const app = express();
app.use(cors());
app.use(express.json());
const port = 3000;

app.get("/say/random", async (req, res) => {
  const [[wiseSayingRow]] = await pool.query(
    `
    SELECT *
    FROM saying
    ORDER BY RAND()
    LIMIT 1
    `
  );
  if (wiseSayingRow === undefined) {
    res.status(404).json({
      resultCode: "F-1",
      msg: "404 not found",
    });
    return;
  }
  wiseSayingRow.hit++;
  await pool.query(
    `
    UPDATE saying
    SET hit = ?
    WHERE id = ?
    `,
    [wiseSayingRow.hit, wiseSayingRow.id]
  );
  res.json({
    resultCode: "S-1",
    msg: "성공",
    data: wiseSayingRow,
  });
});

app.patch("/say/:id", async (req, res) => {
  const { id } = req.params;
  const [[wiseSayingRow]] = await pool.query(
    `
    SELECT *
    FROM saying
    WHERE id = ?
    `,
    [id]
  );

  if (wiseSayingRow === undefined) {
    res.status(404).json({
      resultCode: "F-1",
      msg: "404 not found",
    });
    return;
  }

  const {
    say_D = wiseSayingRow.say_D,
    content = wiseSayingRow.content,
    nam = wiseSayingRow.nam,
    view_ws = wiseSayingRow.view_ws,
    hit = wiseSayingRow.hit,
    likePoint = wiseSayingRow.likePoint + 1,
  } = req.body;

  await pool.query(
    `
    UPDATE saying
    SET say_D = ?,
    content = ?,
    nam = ?,
    view_ws = ?,
    hit = ?,
    likePoint = ?
    WHERE id = ?
    `,
    [say_D, content, nam, view_ws, hit, likePoint, id]
  );

  const [[justModifiedWiseSayingRow]] = await pool.query(
    `
    SELECT *
    FROM saying
    WHERE id = ?
    `,
    [id]
  );

  res.json({
    resultCode: "S-1",
    msg: "성공",
    data: justModifiedWiseSayingRow,
  });
});

app.listen(port, () => {
  console.log(`Wise saying app listening on port ${port}`);
});
