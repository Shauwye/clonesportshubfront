import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { BarChart3, TrendingUp, Trophy, Award, Medal } from 'lucide-react';

export function RankingsPage() {
  const [selectedGroup, setSelectedGroup] = useState('global');

  const globalRankings = [
    { id: '1', name: 'Carlos Rodríguez', points: 1245, country: '🇦🇷', streak: 15, rank: 1 },
    { id: '2', name: 'María González', points: 1230, country: '🇲🇽', streak: 12, rank: 2 },
    { id: '3', name: 'Juan Pérez', points: 1215, country: '🇪🇸', streak: 10, rank: 3 },
    { id: '4', name: 'Ana Martínez', points: 1198, country: '🇧🇷', streak: 8, rank: 4 },
    { id: '5', name: 'Pedro López', points: 1185, country: '🇨🇴', streak: 7, rank: 5 },
    { id: '6', name: 'Laura Fernández', points: 1170, country: '🇦🇷', streak: 9, rank: 6 },
    { id: '7', name: 'Diego Silva', points: 1155, country: '🇺🇾', streak: 6, rank: 7 },
    { id: '8', name: 'Carmen Ruiz', points: 1140, country: '🇲🇽', streak: 11, rank: 8 },
    { id: '9', name: 'Roberto García', points: 1125, country: '🇨🇱', streak: 5, rank: 9 },
    { id: '10', name: 'Sofía Moreno', points: 1110, country: '🇵🇪', streak: 8, rank: 10 },
  ];

  const myGroups = [
    { value: 'global', label: 'Ranking Global' },
    { value: 'friends', label: 'Amigos del Fútbol' },
    { value: 'office', label: 'Oficina Tech' },
    { value: 'family', label: 'Familia Pérez' },
  ];

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
          <BarChart3 className="size-8 text-purple-600" />
          Rankings
        </h1>
        <p className="text-gray-600">
          Compara tu rendimiento con otros participantes
        </p>
      </div>

      {/* My Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="size-4 text-yellow-600" />
              Posición Global
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-yellow-700">#127</div>
            <p className="text-sm text-yellow-700 mt-1">de 45,892 usuarios</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="size-4" />
              Puntos Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-600">1,058</div>
            <p className="text-sm text-gray-600 mt-1">+45 esta semana</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="size-4" />
              Mejor Racha
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-600">12</div>
            <p className="text-sm text-gray-600 mt-1">aciertos seguidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Medal className="size-4" />
              Tasa de Acierto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-purple-600">76%</div>
            <p className="text-sm text-gray-600 mt-1">muy bueno</p>
          </CardContent>
        </Card>
      </div>

      {/* Rankings Tabs */}
      <Tabs defaultValue="overall" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overall">General</TabsTrigger>
          <TabsTrigger value="weekly">Semanal</TabsTrigger>
          <TabsTrigger value="groups">Grupos</TabsTrigger>
        </TabsList>

        <TabsContent value="overall" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle>Ranking General</CardTitle>
                  <CardDescription>
                    Los mejores jugadores del Mundial 2026 Hub
                  </CardDescription>
                </div>
                <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Seleccionar ranking" />
                  </SelectTrigger>
                  <SelectContent>
                    {myGroups.map((group) => (
                      <SelectItem key={group.value} value={group.value}>
                        {group.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {globalRankings.map((user) => (
                  <div
                    key={user.id}
                    className={`flex items-center gap-4 p-4 rounded-lg ${
                      user.rank === 1
                        ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-2 border-yellow-300'
                        : user.rank === 2
                        ? 'bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-300'
                        : user.rank === 3
                        ? 'bg-gradient-to-r from-orange-50 to-orange-100 border-2 border-orange-300'
                        : 'bg-gray-50 hover:bg-gray-100'
                    } transition-colors`}
                  >
                    {/* Rank */}
                    <div className="text-2xl font-bold w-12 text-center">
                      {user.rank === 1 && '🥇'}
                      {user.rank === 2 && '🥈'}
                      {user.rank === 3 && '🥉'}
                      {user.rank > 3 && (
                        <span className="text-gray-600">#{user.rank}</span>
                      )}
                    </div>

                    {/* Avatar & Name */}
                    <Avatar className="size-12">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-semibold flex items-center gap-2">
                        <span>{user.name}</span>
                        <span className="text-lg">{user.country}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Racha: {user.streak} aciertos
                      </div>
                    </div>

                    {/* Points */}
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {user.points.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-600">puntos</div>
                    </div>

                    {/* Badges */}
                    {user.rank <= 3 && (
                      <Badge
                        className={
                          user.rank === 1
                            ? 'bg-yellow-600'
                            : user.rank === 2
                            ? 'bg-gray-600'
                            : 'bg-orange-600'
                        }
                      >
                        Top {user.rank}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>

              {/* Load More */}
              <div className="text-center mt-6">
                <p className="text-sm text-gray-600 mb-3">
                  Mostrando top 10 de 45,892 jugadores
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weekly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ranking Semanal</CardTitle>
              <CardDescription>
                Los mejores de esta semana (19 - 25 Marzo)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {globalRankings.slice(0, 5).map((user, index) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-4 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="text-2xl font-bold w-12 text-center text-gray-600">
                      #{index + 1}
                    </div>
                    <Avatar className="size-12">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-semibold">{user.name}</div>
                      <div className="text-sm text-gray-600">
                        +{Math.floor(Math.random() * 50 + 30)} pts esta semana
                      </div>
                    </div>
                    <Badge variant="secondary">🔥 En racha</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="groups" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Amigos del Fútbol</CardTitle>
                <CardDescription>24 miembros</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {globalRankings.slice(0, 3).map((user, index) => (
                    <div key={user.id} className="flex items-center gap-3">
                      <div className="text-xl font-bold w-8">#{index + 1}</div>
                      <Avatar className="size-10">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{user.name}</div>
                        <div className="text-xs text-gray-600">
                          {user.points} pts
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Oficina Tech</CardTitle>
                <CardDescription>15 miembros</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {globalRankings.slice(3, 6).map((user, index) => (
                    <div key={user.id} className="flex items-center gap-3">
                      <div className="text-xl font-bold w-8">#{index + 1}</div>
                      <Avatar className="size-10">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{user.name}</div>
                        <div className="text-xs text-gray-600">
                          {user.points} pts
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
