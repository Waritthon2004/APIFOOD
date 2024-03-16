import express from "express";
import { conn } from "../dbconnet";
import mysql from "mysql";
export const router = express.Router();
router.post("/chart",async (req, res) => {
  
  const data = req.body;
  let sql = "SELECT DISTINCT DATE_FORMAT(Date, '%Y-%m-%d') AS Date, point  FROM Statics  WHERE PID = 102 AND DATEDIFF(Date, CURDATE()) <= 7 ORDER BY Date ASC";
  conn.query(sql, (err, result) => {
    if (err) throw err;
    res
      .status(200)
      .json(result);
    console.log(result);
    
  });
});




router.put("/",async (req, res) => {
  const image = req.body;
  let pointA = 0;
  let pointB  = 0;
  let a = 1 / (1 + Math.pow(10, (image.point2 - image.point1) / 400));
  let b = 1 / (1 + Math.pow(10, (image.point1- image.point2) / 400));
  let str1 = "";
  let str2 = "";


  if (image.win == 1) {
      pointA = image.point1 + 32 * (1 - a);
      pointB = image.point2 + 32 * (0 - b);
      str1 = image.point1+"+ 32 * (1 - "+a+")";
      str2 = image.point2+"+ 32 * (0 - "+b+")";
 
  } else if (image.win == 2) {
      pointA = image.point1 + 32 * (0 - a);
      pointB = image.point2 + 32 * (1 - b);

      str1 = image.point1+" 32 * (0 - "+a+")";
      str2 = image.point2+" 32 * (1 - "+b+")";
  }

  if(pointA <=0){
    pointA = 0;
  }

  if(pointB <=0){
    pointB = 0;
  }
  const currentDate = new Date().toISOString().slice(0, 10);
  console.log(currentDate);
  
  
  
  let check1: any = await new Promise((resolve, reject) => {
    conn.query("select SID from Statics where `Date` = ?  and `PID` = ?", [currentDate,image.PID1], (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });

  let check2: any = await new Promise((resolve, reject) => {
    conn.query("select SID from Statics where `Date` = ?  and `PID` = ?", [currentDate,image.PID2], (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });

  let sql1 = "";
  let sql2 = "";
  console.log(check1,check2);
  
 
  if(check1.length>0){
    sql1 = "update Statics set `point` = ?  where `SID` = ?";
    sql1 = mysql.format(sql1, [pointA, check1[0].SID]);
  }
  else{
    sql1 = "INSERT INTO `Statics`(`PID`, `Date`, `point`) VALUES (?,?,?)";
    sql1 = mysql.format(sql1, [image.PID1,currentDate, pointA]);
  }

  if(check2.length>0){
     sql2 = "update Statics set `point` = ?  where `SID` = ?";
    sql2 = mysql.format(sql2, [pointB,check2[0].SID]);
  }
  else{
    sql2 = "INSERT INTO `Statics`(`PID`, `Date`, `point`) VALUES (?,?,?)";
    sql2 = mysql.format(sql2, [image.PID2, currentDate,pointB]);
  }
console.log(sql1);
console.log(sql2);


  Promise.all([
    new Promise((resolve, reject) => {
      conn.query(sql1, (err, result) => {
        if (err) reject(err);
        resolve(result.affectedRows);
      });
    }),
    new Promise((resolve, reject) => {
      conn.query(sql2, (err, result) => {
        if (err) reject(err);
        resolve(result.affectedRows);
      });
    })
  ])
    .then(results => {
      
      
      res.status(200).json({
        Win : image.win ,
        URL1: image.URL1,
        URL2: image.URL2,
        cala : "1 / (1 + Math.pow(10, (" + image.point2 +" - " + image.point1 + ") / 400)) ",
        calb : "1 / (1 + Math.pow(10, (" + image.point1 +" - " + image.point2 + ") / 400)) ",
        ra : a,
        rb : b,
        sum1 :str1,
        sum2 : sql2,
        newA : pointA,
        newB : pointB,
        point1: image.point1,
        point2: image.point2,
      }
    
      );
      
    })
    .catch(err => {
      res.status(400).send(err);
    });

    // const datepipe: DatePipe = new DatePipe('en-US')
    // let formattedDate = datepipe.transform(new Date(), 'YYYY-MM-dd')
    // console.log(formattedDate);
    const date = getCurrentDate();
console.log(date);
});


function getCurrentDate(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); 
  const day = date.getDate().toString().padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

