import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Users, Plus, Crown, TrendingUp, Trophy } from 'lucide-react';
import { toast } from 'sonner';

export function GroupsPage() {
  const [newGroupName, setNewGroupName] = useState('');

  const myGroups = [
    {
      id: '1',
      name: 'Amigos del Fútbol',
      members: 24,
      myRank: 3,
      avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=futbol',
      admin: true,
    },
    {
      id: '2',
      name: 'Oficina Tech',
      members: 15,
      myRank: 1,
      avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=tech',
      admin: false,
    },
    {
      id: '3',
      name: 'Familia Pérez',
      members: 8,
      myRank: 2,
      avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=familia',
      admin: false,
    },
  ];

  const topMembers = [
    { id: '1', name: 'Carlos Rodríguez', points: 245, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos', rank: 1 },
    { id: '2', name: 'María González', points: 230, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria', rank: 2 },
    { id: '3', name: 'Juan Pérez', points: 215, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Juan', rank: 3 },
    { id: '4', name: 'Ana Martínez', points: 198, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ana', rank: 4 },
    { id: '5', name: 'Pedro López', points: 185, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pedro', rank: 5 },
  ];

  const handleCreateGroup = () => {
    if (newGroupName.trim()) {
      toast.success(`Grupo "${newGroupName}" creado exitosamente`);
      setNewGroupName('');
    }
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
            <Users className="size-8 text-blue-600" />
            Grupos
          </h1>
          <p className="text-gray-600">Compite con tus amigos y familiares</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 size-4" />
              Crear Grupo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Grupo</DialogTitle>
              <DialogDescription>
                Crea un grupo para competir con tus amigos en el Mundial
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="groupName">Nombre del Grupo</Label>
                <Input
                  id="groupName"
                  placeholder="Ej: Amigos del Mundial"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                />
              </div>
              <Button onClick={handleCreateGroup} className="w-full">
                Crear Grupo
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* My Groups */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Mis Grupos</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myGroups.map((group) => (
            <Card key={group.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="size-12">
                    <AvatarImage src={group.avatar} />
                    <AvatarFallback>{group.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      {group.name}
                      {group.admin && (
                        <Crown className="size-4 text-yellow-600" />
                      )}
                    </CardTitle>
                    <CardDescription>{group.members} miembros</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      #{group.myRank}
                    </div>
                    <div className="text-xs text-gray-600">Mi posición</div>
                  </div>
                  <Badge variant={group.myRank === 1 ? 'default' : 'secondary'}>
                    {group.myRank === 1 ? 'Líder' : `Top ${Math.ceil((group.myRank / group.members) * 100)}%`}
                  </Badge>
                </div>
                <Button variant="outline" className="w-full">
                  Ver Detalles
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Featured Group Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="size-5" />
            Amigos del Fútbol - Clasificación
          </CardTitle>
          <CardDescription>Top 5 del grupo esta semana</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topMembers.map((member) => (
              <div
                key={member.id}
                className={`flex items-center gap-4 p-3 rounded-lg ${
                  member.rank === 1
                    ? 'bg-yellow-50 border-2 border-yellow-200'
                    : member.rank === 2
                    ? 'bg-gray-50 border-2 border-gray-300'
                    : member.rank === 3
                    ? 'bg-orange-50 border-2 border-orange-200'
                    : 'bg-gray-50'
                }`}
              >
                <div className="text-2xl font-bold w-8 text-center">
                  {member.rank === 1 && '🥇'}
                  {member.rank === 2 && '🥈'}
                  {member.rank === 3 && '🥉'}
                  {member.rank > 3 && `#${member.rank}`}
                </div>
                <Avatar>
                  <AvatarImage src={member.avatar} />
                  <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-semibold">{member.name}</div>
                  <div className="text-sm text-gray-600">{member.points} puntos</div>
                </div>
                {member.rank === 1 && (
                  <Badge className="bg-yellow-600">
                    <Crown className="size-3 mr-1" />
                    Líder
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Group Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="size-4" />
              Total Miembros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">47</div>
            <p className="text-sm text-gray-600 mt-1">en todos tus grupos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="size-4" />
              Posición Promedio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">#2</div>
            <p className="text-sm text-gray-600 mt-1">mejorando cada semana</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="size-4" />
              Victorias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">12</div>
            <p className="text-sm text-gray-600 mt-1">veces en primer lugar</p>
          </CardContent>
        </Card>
      </div>

      {/* Invite Section */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <Users className="size-12 text-blue-600" />
            <div className="flex-1 text-center md:text-left">
              <h3 className="font-semibold text-lg mb-1">
                Invita a tus amigos
              </h3>
              <p className="text-sm text-gray-600">
                Comparte tu código de invitación y competir juntos en el Mundial
              </p>
            </div>
            <Button>Compartir Código</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
