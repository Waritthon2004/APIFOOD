import express from "express";
import { conn } from "../dbconnet";
import mysql from "mysql";
//router = ตัวจัดการเส้นทาง
export const router = express.Router();

router.get("/all", (req, res) => {
  let sql = "SELECT * FROM Picture";
  conn.query(sql, (err, result) => {
    if (err) throw err;
    res.status(200).json(result);
  });
});
//get image by id
router.get("/all/:id", (req, res) => {
  const id = req.params.id;
  let sql = `SELECT PID,UID, point, url, ROW_NUMBER() OVER (ORDER BY point DESC) AS "rank" 
  FROM (
      SELECT Picture.PID,User.UID, MAX(Statics.point) AS point, MAX(url) AS url 
      FROM Statics, Picture ,User
      WHERE Picture.PID = Statics.PID 
      AND Picture.UID = User.UID
      AND Statics.Date = (SELECT MAX(Date)FROM Statics) 
      AND User.UID = ?
      GROUP BY Picture.PID 
  ) 
  AS max_points ORDER BY point,PID `;
  conn.query(sql, [id], (err, result) => {
    if (err) throw err;
    res.status(200).json(result);
  });
});


router.post("/", async (req, res) => {
 
  
  let data = req.body;

  let sql = "DELETE FROM Delay WHERE TIMESTAMPDIFF(SECOND, Time, NOW()) >= ?";
  sql = mysql.format(sql, [data]);
  conn.query(sql, async (err, result) => {
    if (err) throw err;
    let check1: any = await new Promise((resolve, reject) => {
      conn.query("SELECT Picture.PID as PID, Picture.url as url, Statics.point as point ,User.image as User ,User.Firstname as Name  FROM Picture, Statics,User WHERE Picture.PID = Statics.PID AND Picture.UID = User.UID AND DATEDIFF(CURDATE(), Date) = 0  AND Picture.PID NOT IN (SELECT PID FROM Delay)  ORDER BY RAND()  LIMIT 2 ", (err, result) => {
        if (err) reject(err);
        resolve(result);
      }); 
    });
  
    console.log(check1);
    
    res.status(200).json({
      name1 :check1[0].Name,
      user1 :check1[0].User,
      pid1: check1[0].PID,
      image1: check1[0].url,
      point1: check1[0].point,

      name2 :check1[1].Name,
      user2 :check1[1].User,
      image2: check1[1].url,
      point2: check1[1].point,
      pid2: check1[1].PID,
    });

  });
  
});


router.post("/delay", async (req, res) => {
  
  let data = req.body;

  if (data.win == 1) {
    let sql = "INSERT INTO `Delay`(`PID`, `Time`) VALUES (?,NOW())";
    sql = mysql.format(sql, [data.PID1]);
    conn.query(sql, (err, result) => {
      if (err) throw err;
      res.json(result);
    });
    
  } else {
    let sql = "INSERT INTO `Delay`(`PID`, `Time`) VALUES (?,NOW())";
    sql = mysql.format(sql, [data.PID2]);
    conn.query(sql, [data.PID2], (err, result) => {
      if (err) throw err;
      res.json(result);
    });
  }
 
  
});

router.delete("/:id", (req, res) => {
  const id = req.params.id;
  if (id === "undefined") {
    return res.status(400).json({ error: "ID is undefined" });
  }

  console.log(id);
  let sql = "DELETE FROM Picture WHERE PID = ?";
  conn.query(sql, [id], (err, result) => {
    if (err) throw err;
    else res.json({ affected_row: result.affectedRows });
  });
});

router.post("/delayshow",async (req, res) => {
 
  
  console.log(req.body);
  
  let data = req.body;
  let sql = "DELETE FROM Delay WHERE TIMESTAMPDIFF(SECOND, Time, NOW()) >= ?";
  sql = mysql.format(sql, [data]);
  console.log(sql);
  
  conn.query(sql,  (err, result) => {
    if (err) throw err;

  });
  let check1: any = await new Promise((resolve, reject) => {
    conn.query("SELECT URL,TIMESTAMPDIFF(SECOND, Time, Now()) AS time_diff_seconds FROM Delay,Picture where Delay.PID = Picture.PID  ORDER by time_diff_seconds DESC", (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
  res.json(check1);

});

router.get("/date/:day", (req, res) => {
  const day = req.params.day;
  let sql =
    "SELECT * FROM Statics,Picture WHERE Picture.PID = Statics.PID and DATEDIFF(CURDATE(),Date )=?";
  conn.query(sql, [day], (err, result) => {
    if (err) throw err;
    res.json(result);
  });
});

router.get("/checkday", (req, res) => {
  let sql =
    "SELECT * FROM Statics WHERE  DATEDIFF(CURDATE(),Date )=0";
  conn.query(sql, (err, result) => {
    if (err) throw err;

    if(result.length == 0){
      res.json({do : "True"});
    }
    else{
      res.json({do : "False"});
    }
    
  });
});

router.get("/newday", (req, res) => {
      let sql =
        "SELECT DISTINCT PID, point FROM Statics Where DATEDIFF(CURDATE(), Date) = 1";
        conn.query(sql, async (err, result) => {
          if (err) throw err;
          if (result.length > 0) {
            for (let i = 0; i < result.length; i++) {
              const currentDate = getCurrentDate();
              await new Promise((resolve, reject) => {
                conn.query(
                  "INSERT INTO `Statics`(`PID`, `Date`, `point`) VALUES (?,?,?)",
                  [result[i].PID, currentDate, result[i].point],
                  (err, result) => {
                    if (err) reject(err);
                    resolve(result);
                  }
                );
              });
            }
          }
        });     
});




function getCurrentDate(): string {
  const date = new Date();
  const timeZoneOffset = date.getTimezoneOffset() / 60;
  date.setHours(date.getHours() + timeZoneOffset + 7); // UTC+7 for Bangkok
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");

  return `${year}-${month}-${day}`;
}
