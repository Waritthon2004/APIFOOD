import express from "express";
import { conn } from "../dbconnet";
import mysql from "mysql";
import bcrypt from "bcrypt";
import { Loginrespone } from "../model/modellogin";
import multer from "multer";
//router = ตัวจัดการเส้นทาง
export const router = express.Router();




const firebaseConfig = {
  apiKey: "AIzaSyBhuVgmc1U5l8WvDfMtZUUONxkNp3QtFRc",
  authDomain: "foodrate-101roi-et.firebaseapp.com",
  projectId: "foodrate-101roi-et",
  storageBucket: "foodrate-101roi-et.appspot.com",
  messagingSenderId: "932396135284",
  appId: "1:932396135284:web:b4d8da7bc3ec3f57eeb221",
  measurementId: "G-YKWBWP84N6"
};

import {initializeApp} from "firebase/app";
import { getStorage,ref,uploadBytesResumable,getDownloadURL} from "firebase/storage"
//Connect to fire base
initializeApp(firebaseConfig);
//Connect to Storage
const storage = getStorage();


// Middleware save to memory
class FileMiddleware {
  //Attribute of class
filename = "";
 //Attribute diskloader for saving file to disk
public readonly diskLoader = multer({
  // storage = saving file to memory
  storage: multer.memoryStorage(),
  // limit file size
  limits: {
    fileSize: 67108864, // 64 MByte
  },
});
}


router.get("/", (req, res) => {
  const sql = "Select * from User where type = 0 LIMIT 5";
  conn.query(sql, async(err, result) => {
    if (err) {
      res.status(400).json(err);
    } else {
      let check2: any = await new Promise((resolve, reject) => {
        conn.query("Select count(UID) as COUNT from User ", (err, result) => {
          if (err) reject(err);
          resolve(result);
        });
      });
      res.json({
        data : result,
        Row : check2[0].COUNT
      });
    }
  });
});


router.post("/page", (req, res) => {
  let ca = req.body;
  let x = 0;
  for(let i = 1 ;i<ca.page ;i++){
    x+=5;
  } 
  let sql = "SELECT * FROM User Where type = 0 ORDER BY UID ASC LIMIT 5 OFFSET ?";
  sql = mysql.format(sql, [
   x
  ]);
  conn.query(sql, (err, result) => {
    if (err) {
      res.status(400).json(err);
    } else {
      console.log(sql);
      
      res.json(result);
    }
  });
});


// แฮชรหัสผ่านแบบแฮช
const fileupload = new FileMiddleware();
function hashPassword(password: any) {
  const saltRounds = 10;
  const hashedPassword = bcrypt.hashSync(password, saltRounds);
  return hashedPassword;
}


// เปรียบเทียบรหัสผ่านแบบแฮช
function comparePassword(
  inputPassword: any,
  hashedPassword: any){
  return bcrypt.compareSync(inputPassword, hashedPassword);
}




router.post("/", fileupload.diskLoader.single("file"),async (req, res) => {
  let user = req.body; 
  let UID;
  try {
     //Upload to firebase storage
  const filename = Math.round(Math.random() * 1000)+".png";
  // Define locations to be saved on storag
  const storageRef = ref(storage,"/images/"+filename);
  // define file detail
  const metaData = {contentType : req.file!.mimetype};
  // Start upload
  const snapshost = await uploadBytesResumable(storageRef,req.file!.buffer, metaData);
  //Get url image from storage
  const url = await getDownloadURL(snapshost.ref)
    const password = user.Password;
    user.Password = hashPassword(password);
    const type = 0;
    let sql =
      "INSERT INTO `User`(`Firstname`, `Lastname`, `Email`, `Password`,`image`, `type`) VALUES (?,?,?,?,?,?)";
    sql = mysql.format(sql, [
      user.Firstname,
      user.Lastname,
      user.Email,
      user.Password,
      url,
      type
    ]);

    conn.query(sql, (err, result) => {
      if (err) throw err;


      UID = result.insertId;
      res.status(201).json({
        affected_row: result.affectedRows,
        last_idx: result.insertId,  
        Err : "true"
      });
    });

   
  } catch (error) {
    res.json({Err : "false"});
  }
 

});


router.post("/check", async (req, res) => {
  let user: Loginrespone = req.body;

  let sql = "SELECT UID, Email, Password,type FROM User WHERE Email = ?";
  sql = mysql.format(sql, [user.Email]);
  conn.query(sql, (err, result) => {
      if (err) throw err;

      if (result && result.length > 0) {
          if (comparePassword(user.Password, result[0].Password)) {
              res.status(201).json({ 
                UID: result[0].UID,
                type:result[0].type
              
              });
          } else {
              res.json({ UID: "Password not correct" });
          }
      } else {
          res.json({ UID: "Invalid Eamil" });
      }
  });
});



router.get("/:id", async (req,res)=>{
  const id = req.params.id;
  const sql = "select * from User where UID = ?";
  conn.query(sql,[id],(err,result)=>{
    if(err) res.status(400).json(err);
    else res.json(result);
  })
})


router.put("/:id", fileupload.diskLoader.single("file"),async (req, res) => {
  const id = req.params.id;
  
  let user = req.body;
  console.log("hi",req.body);
  
 
  
  try {
     //Upload to firebase storage
  const filename = Math.round(Math.random() * 1000)+".png";
  // Define locations to be saved on storag
  const storageRef = ref(storage,"/images/"+filename);
  // define file detail
  const metaData = {contentType : req.file!.mimetype};
  // Start upload
  const snapshost = await uploadBytesResumable(storageRef,req.file!.buffer, metaData);
  //Get url image from storage
  const url = await getDownloadURL(snapshost.ref)
    // const password = user.Password;
    // user.Password = await hashPassword(password); 
    console.log('url:',url);
    
    let sql =
      "UPDATE `User` SET `Firstname` = ?, `Lastname` = ?,  `Email` = ? ,  `image` = ?  WHERE `UID` = ?" ;
    sql = mysql.format(sql, [
      user.Firstname,
      user.Lastname,
      user.Email,
      url,
      id
    ]);
   
    
    conn.query(sql, (err, result) => {
      if (err) throw err;
      res.status(201).json({
        affected_row: result.affectedRows,
        last_idx: result.insertId,
      });
    });

   
  } catch (error) {
    let sql =
    "UPDATE `User` SET `Firstname` = ?, `Lastname` = ?,  `Email` = ?   WHERE `UID` = ?" ;
  sql = mysql.format(sql, [
    user.Firstname,
    user.Lastname,
    user.Email,
    id
  ]);
  conn.query(sql, (err, result) => {
    if (err) throw err;
    res.status(201).json({
      affected_row: result.affectedRows,
      last_idx: result.insertId,
    });
  });
 
  }
 

});

router.put('password/:id',(req,res)=>{
  let user = req.body;
  console.log("hi",req.body);

})