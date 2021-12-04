from legcalculations import calc_angle_a, calc_angle_c, calPos, clamp_motor_3_positions, calculate_motor_1_angle, calc_angles
# from main_1 import  
import unittest


# class Test_Test_calculate_motor_1_angle(unittest.TestCase):
#     def test_calculate_motor_1_angle(self):
#         self.assertEqual(calculate_motor_1_angle(180,234,150), 130)
#         self.assertEqual(calculate_motor_1_angle(180,206,100), 119)
#         # self.assertEqual(calculate_motor_1_angle(170, 100), 120)

#     def test_less_than_zero(self):
#         self.assertEqual(calculate_motor_1_angle(180,206,-100), 61)
#         self.assertEqual(calculate_motor_1_angle(170, 170,0), 90)
#         self.assertEqual(calculate_motor_1_angle(170,197, -100), 60)


# class Test_calc_angle_a(unittest.TestCase):
#     def test_calc_angle_a(self):
#         self.assertEqual(calc_angle_a(193.49, 70, 171.17), 98)
#         self.assertEqual(calc_angle_a(171.17, 20, 170), 90)
#         self.assertEqual(calc_angle_a(200, 224, 100), 63)

class Test_calc_angle_c(unittest.TestCase):
    def test_calc_angle_c(self):
        self.assertEqual(calc_angle_c(193.49, 70, 238.54), 123)
        self.assertEqual(calc_angle_c(193.49, 70, 164.1), 55)
        # self.assertEqual(calc_angle_c(171.17, 20, 170), 90)
        self.assertEqual(calc_angle_c(205.91, 100, 180), 61)

        self.assertEqual(calc_angle_c(200, 224, 100), 27)

class Test_calc_angles(unittest.TestCase):
    def test_calc_angles(self):
       
        self.assertAlmostEqual(calc_angles(180, 120, 150)[0], 130,delta=2)
        self.assertAlmostEqual(calc_angles(180, 120, 150)[1], 113,delta=2)
        self.assertAlmostEqual(calc_angles(180, 120, 150)[2], 60,delta=2)
        self.assertAlmostEqual(calc_angles(180, 120, 140)[0], 128,delta=2)
        self.assertAlmostEqual(calc_angles(180, 120, 140)[1], 98,delta=2)
        self.assertAlmostEqual(calc_angles(180, 120, 140)[2], 81,delta=2)
  

    def test_calc_angles_motor_1_negative_values(self):
        self.assertAlmostEqual(calc_angles(180, 120, -140)[0], 52,delta=2)
        self.assertAlmostEqual(calc_angles(180, 120, -140)[1], 98,delta=2)
        self.assertAlmostEqual(calc_angles(180, 120, -140)[2], 81,delta=2)
        #
        self.assertAlmostEqual(calc_angles(180, 120, -1)[0], 90,delta=2)
        self.assertAlmostEqual(calc_angles(180, 120, -1)[1], 62,delta=2)
        self.assertAlmostEqual(calc_angles(180, 120, -1)[2], 135,delta=2)
       
        # self.assertAlmostEqual(calc_angles(180, 120, 150)[0], 130,delta=2)
        # self.assertAlmostEqual(calc_angles(180, 120, 150)[1], 113,delta=2)
        # self.assertAlmostEqual(calc_angles(180, 120, 150)[2], 60,delta=2)
  
class Test_calc_angles(unittest.TestCase):

    def test_calPos(self):
        self.assertEqual(calPos(20), 183)
        self.assertEqual(calPos(90), 474)
        self.assertEqual(calPos(148), 715)
        self.assertEqual(calPos(202), 940)
        

class Test_clamp_clamp_motor_3_positions(unittest.TestCase):

    def test_clamp_clamp_motor_3_positions_exceeds(self):
        self.assertEqual(clamp_motor_3_positions(290), 261)
        self.assertEqual(clamp_motor_3_positions(300), 261)

    def test_clamp_clamp_motor_3_positions_less_than(self):
        self.assertEqual(clamp_motor_3_positions(50), 148)
        self.assertEqual(clamp_motor_3_positions(3), 148)

    def test_clamp_clamp_motor_3_positions_in_range(self):
        self.assertEqual(clamp_motor_3_positions(149), 149)
        self.assertEqual(clamp_motor_3_positions(260), 260)
        self.assertEqual(clamp_motor_3_positions(200), 200)


        # self.assertEqual(clamp_motor_3_positions(463), 263)
        # self.assertEqual(clamp_motor_3_positions(100), 148)
        # self.assertEqual(clamp_motor_3_positions(190), 190)

  
if __name__ == '__main__':
    unittest.main()
