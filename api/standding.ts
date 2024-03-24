import express from "express";
import { conn } from "../dbconnet";
import mysql from "mysql";


export const router = express.Router();


router.get("/", (req, res) => {
    let sql = `SELECT PID, point, url, ROW_NUMBER() OVER (ORDER BY point DESC) AS "rank" 
    FROM (
        SELECT Picture.PID, MAX(Statics.point) AS point, MAX(url) AS url 
        FROM Statics, Picture 
        WHERE Picture.PID = Statics.PID AND Statics.Date = (SELECT MAX(Date) FROM Statics) GROUP BY 	  	Picture.PID 
    ) 
    AS max_points ORDER BY point DESC LIMIT 10`;
    conn.query(sql, (err, result) => {
      if (err) throw err;
      res
        .status(200)
        .json(result);
    });
  });

  router.get("/pervious", (req, res) => {
    let sql = `SELECT PID, point, url, ROW_NUMBER() OVER (ORDER BY point DESC) AS "rank" 
    FROM (
        SELECT Picture.PID, MAX(Statics.point) AS point, MAX(url) AS url 
        FROM Statics, Picture 
        WHERE Picture.PID = Statics.PID AND Statics.Date = (SELECT MAX(Date)-1 FROM Statics) GROUP BY 	  	Picture.PID 
    ) 
    AS max_points ORDER BY point DESC
    `;
    conn.query(sql, (err, result) => {
      if (err) throw err;
      res
        .status(200)
        .json(result);
    });
  });

  router.get("/admin", (req, res) => {
    let sql = `SELECT PID, point, url, ROW_NUMBER() OVER (ORDER BY point DESC) AS "rank" 
    FROM (
        SELECT Picture.PID, MAX(Statics.point) AS point, MAX(url) AS url 
        FROM Statics, Picture 
        WHERE Picture.PID = Statics.PID AND Statics.Date = (SELECT MAX(Date) FROM Statics) GROUP BY 	  	Picture.PID 
    ) 
    AS max_points ORDER BY point DESC `;
    conn.query(sql, (err, result) => {
      if (err) throw err;
      res
        .status(200)
        .json(result);
    });
  });


  router.post("/page", (req, res) => {
    let ca = req.body;
    let x = 0;
    for(let i = 1 ;i<ca.page ;i++){
      x+=10;
    } 
    // console.log(ca.page);
    
    let sql = `SELECT PID, point, url, ROW_NUMBER() OVER (ORDER BY point DESC) AS "rank" 
    FROM (
        SELECT Picture.PID, MAX(Statics.point) AS point, MAX(url) AS url 
        FROM Statics, Picture 
        WHERE Picture.PID = Statics.PID AND Statics.Date = (SELECT MAX(Date) FROM Statics) GROUP BY 	  	Picture.PID 
    ) 
    AS max_points ORDER BY point DESC LIMIT 10 OFFSET ?`;
   sql = mysql.format(sql, [x]);
    conn.query(sql, (err, result) => {
      if (err) {
        res.status(400).json(err);
      } else {
        // console.log(sql);
        
        res.json(result);
      }
    });
  });