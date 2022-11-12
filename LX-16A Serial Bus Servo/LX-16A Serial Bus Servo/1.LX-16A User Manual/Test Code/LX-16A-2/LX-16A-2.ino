/*******LX-16A串口舵机测试程序2*******
 * Arduino型号：Arduino UNO
 **************************/
#define GET_LOW_BYTE(A) (uint8_t)((A))
//宏函数 获得A的低八位
#define GET_HIGH_BYTE(A) (uint8_t)((A) >> 8)
//宏函数 获得A的高八位
#define BYTE_TO_HW(A, B) ((((uint16_t)(A)) << 8) | (uint8_t)(B))
//宏函数 以A为高八位 B为低八位 合并为16位整形
//
#define LOBOT_SERVO_FRAME_HEADER         0x55
#define LOBOT_SERVO_MOVE_TIME_WRITE      1

byte LobotCheckSum(byte buf[])
{
  byte i;
  uint16_t temp = 0;
  for (i = 2; i < buf[3] + 2; i++) {
    temp += buf[i];
  }
  temp = ~temp;
  i = (byte)temp;
  return i;
}

void LobotSerialServoMove(HardwareSerial &SerialX, uint8_t id, int16_t position, uint16_t time)
{
  byte buf[10];
  if(position < 0)
    position = 0;
  if(position > 1000)
    position = 1000;
  buf[0] = buf[1] = LOBOT_SERVO_FRAME_HEADER;
  buf[2] = id;
  buf[3] = 7;
  buf[4] = LOBOT_SERVO_MOVE_TIME_WRITE;
  buf[5] = GET_LOW_BYTE(position);
  buf[6] = GET_HIGH_BYTE(position);
  buf[7] = GET_LOW_BYTE(time);
  buf[8] = GET_HIGH_BYTE(time);
  buf[9] = LobotCheckSum(buf);
  SerialX.write(buf, 10);
}

void setup() {
  // put your setup code here, to run once:
  Serial.begin(115200);
  delay(1000);
}

#define ID1   1
#define ID2   2

void loop() {
  // put your main code here, to run repeatedly:
  LobotSerialServoMove(Serial, ID1, 100, 500);
  LobotSerialServoMove(Serial, ID2, 500, 500);
  delay(1000);
  LobotSerialServoMove(Serial, ID1, 500, 500);
  LobotSerialServoMove(Serial, ID2, 600, 500);
  delay(1000);
  LobotSerialServoMove(Serial, ID1, 900, 500);
  LobotSerialServoMove(Serial, ID2, 700, 500);
  delay(1000);
  LobotSerialServoMove(Serial, ID1, 500, 500);
  LobotSerialServoMove(Serial, ID2, 600, 500);
  delay(1000);
}
