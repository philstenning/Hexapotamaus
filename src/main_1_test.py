from legcalculations import calc_angle_a,calc_angle_c
from main_1 import calculate_motor_1_angle, calc_angles
import unittest


class Test_Test_calculate_motor_1_angle(unittest.TestCase):
    def test_calculate_motor_1_angle(self):
        self.assertEqual(calculate_motor_1_angle(170, 2), 91)
        self.assertEqual(calculate_motor_1_angle(170, 100), 120)

    def test_less_than_zero(self):
        self.assertEqual(calculate_motor_1_angle(170, 0), 90)
        self.assertEqual(calculate_motor_1_angle(170, -100), 60)


class Test_calc_angle_a(unittest.TestCase):
    def test_calc_angle_a(self):
        self.assertEqual(calc_angle_a(193.49, 70, 171.17), 98)
        self.assertEqual(calc_angle_a(171.17, 20, 170), 90)
        self.assertEqual(calc_angle_a(200, 224, 100), 63)

class Test_calc_angle_c(unittest.TestCase):
    def test_calc_angle_c(self):
        self.assertEqual(calc_angle_c(193.49, 70, 238.54), 123)
        self.assertEqual(calc_angle_c(193.49, 70, 164.1), 55)
        # self.assertEqual(calc_angle_c(171.17, 20, 170), 90)
        self.assertEqual(calc_angle_c(205.91, 100, 180), 61)

        self.assertEqual(calc_angle_c(200, 224, 100), 27)

class Test_calc_angles(unittest.TestCase):
    def test_calc_angles(self):
        # self.assertAlmostEqual(calc_angles(200, 100, 100)[0], 119,delta=2)
        # self.assertAlmostEqual(calc_angles(200, 100, 100)[1], 60,delta=2)
        # self.assertAlmostEqual(calc_angles(200, 100, 100)[2], 128,delta=2)
       
        self.assertAlmostEqual(calc_angles(180, 120, 150)[0], 127,delta=2)
        self.assertAlmostEqual(calc_angles(180, 120, 150)[1], 113,delta=2)
        self.assertAlmostEqual(calc_angles(180, 120, 150)[2], 60,delta=2)
        # self.assertAlmostEqual(calc_angles(200, 100, -150)[0], 53,delta=2)
        # self.assertAlmostEqual(calc_angles(200, 100, 180)[0], 132,delta=2)
        # self.assertAlmostEqual(calc_angles(200, 100, -180)[0], 48,delta=2)


if __name__ == '__main__':
    unittest.main()
